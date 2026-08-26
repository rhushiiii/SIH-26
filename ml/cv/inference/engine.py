import os
from typing import Any, Optional, Dict
import numpy as np
import torch
import segmentation_models_pytorch as smp

from contracts.tile_contract import TileContract
from contracts.segmentation_contract import SegmentationContract, ClassConfidence
from cv.configs.model_config import ModelConfig
from cv.inference.base import InferenceEngine


class RealSegmentationEngine(InferenceEngine):
    """
    Real Segmentation Engine using PyTorch and segmentation_models_pytorch (UNet++).
    Loads model checkpoints for Buildings, Roads, and Waterbodies.
    """

    def __init__(self, config: Optional[ModelConfig] = None):
        self.config = config or ModelConfig()

        # Select Device
        if self.config.device == "cuda":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        elif self.config.device == "cpu":
            self.device = torch.device("cpu")
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Models mapping: class_id -> model instance
        self.models: Dict[str, torch.nn.Module] = {}
        self._init_models()

    def _init_models(self) -> None:
        """Initialize UNet++ binary segmentation models for each class."""
        arch_cfg = self.config.model
        checkpoints = self.config.checkpoints

        model_specs = {
            "building": checkpoints.buildings,
            "road": checkpoints.roads,
            "water": checkpoints.water_bodies,
        }

        for name, ckpt_path in model_specs.items():
            model = smp.UnetPlusPlus(
                encoder_name=arch_cfg.encoder_name,
                encoder_weights=None,
                in_channels=arch_cfg.in_channels,
                classes=1,
                activation="sigmoid",
            )

            if os.path.exists(ckpt_path):
                try:
                    state_dict = torch.load(ckpt_path, map_location=self.device)
                    model.load_state_dict(state_dict)
                    print(f"[P4 Engine] Loaded checkpoint for {name} from {ckpt_path}")
                except Exception as e:
                    print(f"[P4 Engine] Warning: Failed to load checkpoint {ckpt_path}: {e}")
            else:
                print(f"[P4 Engine] Warning: Checkpoint path {ckpt_path} not found.")

            model.to(self.device)
            model.eval()
            self.models[name] = model

    def preprocess(self, tile_data: Any) -> torch.Tensor:
        """
        Preprocess input tile_data into a normalized PyTorch tensor [1, 3, H, W].
        """
        if isinstance(tile_data, torch.Tensor):
            arr = tile_data.cpu().numpy()
        else:
            arr = np.asarray(tile_data)

        # Standardize shape to [H, W, C]
        if arr.ndim == 2:
            arr = np.stack([arr] * 3, axis=-1)
        elif arr.ndim == 3:
            if arr.shape[0] in [1, 3, 4] and arr.shape[0] < arr.shape[1]:
                arr = np.transpose(arr, (1, 2, 0))
            if arr.shape[2] == 1:
                arr = np.concatenate([arr] * 3, axis=-1)
            elif arr.shape[2] > 3:
                arr = arr[:, :, :3]

        # Convert float range if uint8
        if arr.dtype == np.uint8:
            arr = arr.astype(np.float32) / 255.0
        else:
            arr = arr.astype(np.float32)
            if arr.max() > 1.0:
                arr = arr / 255.0

        # Normalize with ImageNet mean and std
        mean = np.array(self.config.preprocessing.mean, dtype=np.float32)
        std = np.array(self.config.preprocessing.std, dtype=np.float32)
        arr = (arr - mean) / std

        # Convert to [1, C, H, W]
        tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(self.device)
        return tensor

    def predict(self, tile: TileContract, tile_data: Any) -> SegmentationContract:
        """
        Runs inference across models, aggregates probabilities, and builds SegmentationContract.
        """
        input_tensor = self.preprocess(tile_data)
        _, _, h, w = input_tensor.shape

        prob_maps = {}
        with torch.no_grad():
            for name, model in self.models.items():
                out = model(input_tensor)  # Shape [1, 1, H, W]
                prob = out.squeeze().cpu().numpy()  # Shape [H, W]
                prob_maps[name] = np.clip(prob, 0.0, 1.0).astype(np.float32)

        p_building = prob_maps.get("building", np.zeros((h, w), dtype=np.float32))
        p_road = prob_maps.get("road", np.zeros((h, w), dtype=np.float32))
        p_water = prob_maps.get("water", np.zeros((h, w), dtype=np.float32))

        # Apply configured per-class threshold weighting
        t_b = self.config.thresholds.get("building", 0.5)
        t_r = self.config.thresholds.get("road", 0.2)
        t_w = self.config.thresholds.get("water", 0.3)

        p_building = np.where(p_building >= t_b, p_building, p_building * 0.2).astype(np.float32)
        p_road = np.where(p_road >= t_r, np.clip(p_road * 1.5, 0.0, 1.0), p_road * 0.2).astype(np.float32)
        p_water = np.where(p_water >= t_w, p_water, p_water * 0.2).astype(np.float32)

        # Compute background probability map
        max_fg = np.maximum(p_building, np.maximum(p_road, p_water))
        p_bg = np.maximum(0.0, 1.0 - max_fg).astype(np.float32)

        # Stack into [4, H, W]
        # Channel 0 = BACKGROUND, 1 = BUILDING, 2 = ROAD, 3 = WATERBODY
        raw_probabilities = np.stack([p_bg, p_building, p_road, p_water], axis=0)

        # Normalize across channel dimension so values sum to 1.0 per pixel
        prob_sum = np.sum(raw_probabilities, axis=0, keepdims=True)
        prob_sum = np.where(prob_sum == 0, 1.0, prob_sum)
        probabilities = (raw_probabilities / prob_sum).astype(np.float32)
        probabilities = np.clip(probabilities, 0.0, 1.0)

        # Predicted mask using argmax
        predicted_mask = np.argmax(probabilities, axis=0).astype(np.uint8)

        # Per-class confidence calculation
        id_to_name = self.config.classes.id_to_name
        class_confidences = []
        for class_id in range(4):
            c_mask = (predicted_mask == class_id)
            if np.any(c_mask):
                avg_conf = float(np.mean(probabilities[class_id, c_mask]))
            else:
                avg_conf = 0.0
            class_confidences.append(
                ClassConfidence(
                    class_id=class_id,
                    class_name=id_to_name.get(class_id, f"CLASS_{class_id}"),
                    confidence=round(avg_conf, 4),
                )
            )

        return SegmentationContract(
            tile_id=tile.tile_id,
            image_id=tile.image_id,
            job_id=tile.job_id,
            model_id=self.config.model.model_id,
            model_version=self.config.model.version,
            classes=class_confidences,
            probabilities=probabilities,
            predicted_mask=predicted_mask,
        )

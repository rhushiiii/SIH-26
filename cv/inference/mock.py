from typing import Any, Optional
import numpy as np

from contracts.tile_contract import TileContract
from contracts.segmentation_contract import SegmentationContract, ClassConfidence
from cv.configs.model_config import ModelConfig
from cv.inference.base import InferenceEngine


class MockInferenceEngine(InferenceEngine):
    """
    Mock inference engine that returns synthetic probabilities and predicted masks
    without relying on PyTorch or loaded model weights.
    Used for early P5 integration and offline testing.
    """

    def __init__(self, config: Optional[ModelConfig] = None, seed: int = 42):
        self.config = config or ModelConfig()
        self.seed = seed

    def predict(self, tile: TileContract, tile_data: Any) -> SegmentationContract:
        # Determine spatial dimensions
        if hasattr(tile_data, "shape"):
            shape = tile_data.shape
            if len(shape) == 3:
                # Could be [C, H, W] or [H, W, C]
                if shape[0] in [1, 3, 4] and shape[0] < shape[1]:
                    h, w = shape[1], shape[2]
                else:
                    h, w = shape[0], shape[1]
            elif len(shape) == 2:
                h, w = shape[0], shape[1]
            else:
                h, w = tile.height, tile.width
        else:
            h, w = tile.height, tile.width

        if h == 0 or w == 0:
            h, w = 512, 512

        rng = np.random.default_rng(self.seed + hash(tile.tile_id) % 1000000)

        # Generate synthetic logits or raw random maps for 4 classes
        # 0: BACKGROUND, 1: BUILDING, 2: ROAD, 3: WATERBODY
        raw_probs = rng.uniform(0.01, 0.99, size=(4, h, w)).astype(np.float32)
        # Softmax over class dimension to ensure sum == 1 and values in [0, 1]
        exp_probs = np.exp(raw_probs - np.max(raw_probs, axis=0, keepdims=True))
        probabilities = (exp_probs / np.sum(exp_probs, axis=0, keepdims=True)).astype(np.float32)

        # Compute predicted mask as argmax
        predicted_mask = np.argmax(probabilities, axis=0).astype(np.uint8)

        # Calculate per-class mean confidence
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
                    confidence=round(avg_conf, 4)
                )
            )

        return SegmentationContract(
            tile_id=tile.tile_id,
            image_id=tile.image_id,
            job_id=tile.job_id,
            model_id=f"mock_{self.config.model.model_id}",
            model_version=self.config.model.version,
            classes=class_confidences,
            probabilities=probabilities,
            predicted_mask=predicted_mask
        )

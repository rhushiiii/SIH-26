from abc import ABC, abstractmethod
from typing import Any

from contracts.tile_contract import TileContract
from contracts.segmentation_contract import SegmentationContract


class InferenceEngine(ABC):
    """
    Abstract Base Class for P4 Inference Engines.
    Strictly accepts TileContract + numpy/tensor tile_data
    and returns SegmentationContract.
    """

    @abstractmethod
    def predict(self, tile: TileContract, tile_data: Any) -> SegmentationContract:
        """
        Run inference on the provided tile.

        Args:
            tile: Metadata contract for the tile (tile_id, image_id, job_id, etc.)
            tile_data: In-memory tile array (NumPy array or Torch Tensor).

        Returns:
            SegmentationContract containing probability maps [4, H, W] (float32)
            and predicted mask [H, W] (uint8).
        """
        pass

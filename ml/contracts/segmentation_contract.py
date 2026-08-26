from pydantic import BaseModel
from typing import List, Optional


class ClassConfidence(BaseModel):
    class_id: int
    class_name: str
    confidence: float


class SegmentationContract(BaseModel):
    """
    P4 → P5 boundary contract.

    probabilities:   numpy ndarray [4, H, W], float32, values in [0.0, 1.0]
                     Classes: 0=BACKGROUND, 1=BUILDING, 2=ROAD, 3=WATERBODY
    predicted_mask:  numpy ndarray [H, W], uint8, values in {0, 1, 2, 3}

    These fields carry in-memory NumPy arrays and are NOT serialised to JSON.
    They are typed as Optional[object] with arbitrary_types_allowed to avoid
    Pydantic validation errors on NumPy dtypes.
    """

    tile_id: str
    image_id: str
    job_id: str
    model_id: str
    model_version: str
    classes: List[ClassConfidence]
    mask_uri: Optional[str] = None

    # In-memory tensors — not JSON-serialised
    probabilities: Optional[object] = None   # ndarray [4, H, W] float32
    predicted_mask: Optional[object] = None  # ndarray [H, W]   uint8

    model_config = {
        "arbitrary_types_allowed": True
    }

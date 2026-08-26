from pydantic import BaseModel
from typing import Optional


class ImageContract(BaseModel):
    image_id: str
    filename: str
    format: str
    width: int
    height: int
    bands: int
    dtype: Optional[str] = None
    crs: Optional[str] = None
    resolution_x_m: Optional[float] = None
    resolution_y_m: Optional[float] = None
    file_size_bytes: Optional[int] = None

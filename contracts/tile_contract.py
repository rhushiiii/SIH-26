from pydantic import BaseModel


class TileContract(BaseModel):
    tile_id: str
    image_id: str
    job_id: str
    x_offset: int
    y_offset: int
    width: int
    height: int
    overlap: int = 64
    sequence: int = 0

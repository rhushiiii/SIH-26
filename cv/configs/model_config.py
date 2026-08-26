import os
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ClassMappingConfig(BaseModel):
    BACKGROUND: int = 0
    BUILDING: int = 1
    ROAD: int = 2
    WATERBODY: int = 3

    @property
    def id_to_name(self) -> Dict[int, str]:
        return {
            self.BACKGROUND: "BACKGROUND",
            self.BUILDING: "BUILDING",
            self.ROAD: "ROAD",
            self.WATERBODY: "WATERBODY",
        }


class PreprocessingConfig(BaseModel):
    input_size: int = 512
    mean: List[float] = Field(default_factory=lambda: [0.485, 0.456, 0.406])
    std: List[float] = Field(default_factory=lambda: [0.229, 0.224, 0.225])


class ModelArchitectureConfig(BaseModel):
    architecture: str = "unetplusplus"
    encoder_name: str = "resnet34"
    model_id: str = "unetplusplus_v1"
    version: str = "1.0.0"
    num_classes: int = 4
    in_channels: int = 3


class CheckpointPathsConfig(BaseModel):
    buildings: str = os.path.join("models", "buildings_unetpp_model.pth")
    roads: str = os.path.join("models", "roads_unetpp_model.pth")
    water_bodies: str = os.path.join("models", "water_bodies_unetpp_model.pth")


class ModelConfig(BaseModel):
    model: ModelArchitectureConfig = Field(default_factory=ModelArchitectureConfig)
    classes: ClassMappingConfig = Field(default_factory=ClassMappingConfig)
    preprocessing: PreprocessingConfig = Field(default_factory=PreprocessingConfig)
    checkpoints: CheckpointPathsConfig = Field(default_factory=CheckpointPathsConfig)
    device: str = "auto"  # "auto", "cuda", or "cpu"
    thresholds: Dict[str, float] = Field(
        default_factory=lambda: {"building": 0.5, "road": 0.2, "water": 0.3}
    )


from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from contracts import FeatureType, ConfidenceLevel, FeatureStatus


class FeatureProperties(BaseModel):
    area_m2: float
    perimeter_m: Optional[float] = None
    length_m: Optional[float] = None
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_level: ConfidenceLevel
    status: FeatureStatus
    centroid: Optional[Dict[str, Any]] = None


class FeatureContract(BaseModel):
    feature_id: str
    image_id: str
    feature_type: FeatureType
    geometry: Dict[str, Any]          # GeoJSON geometry in EPSG:4326
    properties: FeatureProperties
    job_id: Optional[str] = None

    # Backward compatibility accessors for existing ML demo code
    @property
    def area_m2(self) -> float:
        return self.properties.area_m2

    @property
    def perimeter_m(self) -> Optional[float]:
        return self.properties.perimeter_m

    @property
    def length_m(self) -> Optional[float]:
        return self.properties.length_m

    @property
    def confidence(self) -> float:
        return self.properties.confidence

    @property
    def confidence_level(self) -> ConfidenceLevel:
        return self.properties.confidence_level

    @property
    def status(self) -> FeatureStatus:
        return self.properties.status

    @property
    def centroid(self) -> Optional[Dict[str, Any]]:
        return self.properties.centroid


from pydantic import BaseModel
from typing import Dict, Any
from contracts import FeatureType, ConfidenceLevel, FeatureStatus


class FeatureContract(BaseModel):
    feature_id: str
    image_id: str
    job_id: str
    feature_type: FeatureType
    geometry: Dict[str, Any]          # GeoJSON geometry in EPSG:4326
    area_m2: float
    perimeter_m: float
    centroid: Dict[str, Any]          # GeoJSON Point in EPSG:4326
    confidence: float
    confidence_level: ConfidenceLevel
    status: FeatureStatus

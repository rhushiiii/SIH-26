from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class ImageFormat(str, Enum):
    GEOTIFF = "GeoTIFF"
    PNG = "PNG"
    JPEG = "JPEG"


class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    PREPROCESSING = "PREPROCESSING"
    INFERENCE = "INFERENCE"
    POSTPROCESSING = "POSTPROCESSING"
    FINALIZING = "FINALIZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class JobStage(str, Enum):
    IMAGE_VALIDATION = "IMAGE_VALIDATION"
    TILE_GENERATION = "TILE_GENERATION"
    MODEL_INFERENCE = "MODEL_INFERENCE"
    MASK_STITCHING = "MASK_STITCHING"
    POLYGONIZATION = "POLYGONIZATION"
    FEATURE_FINALIZATION = "FEATURE_FINALIZATION"


class FeatureType(str, Enum):
    BUILDING = "BUILDING"
    ROAD = "ROAD"
    WATERBODY = "WATERBODY"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class FeatureStatus(str, Enum):
    AUTO_ACCEPTED = "AUTO_ACCEPTED"
    REVIEW_RECOMMENDED = "REVIEW_RECOMMENDED"
    HUMAN_REVIEW_REQUIRED = "HUMAN_REVIEW_REQUIRED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EDITED = "EDITED"


class ReviewAction(str, Enum):
    ACCEPT = "ACCEPT"
    REJECT = "REJECT"
    EDIT = "EDIT"


class ExportFormat(str, Enum):
    GEOJSON = "GEOJSON"
    CSV = "CSV"


class ImageContract(BaseModel):
    image_id: str
    filename: str
    format: str
    width: int
    height: int
    bands: int
    dtype: Optional[str] = None
    crs: Optional[str] = "EPSG:4326"
    resolution_x_m: Optional[float] = None
    resolution_y_m: Optional[float] = None
    resolution_m: Optional[float] = 0.1
    file_size_bytes: Optional[int] = None
    size_bytes: Optional[int] = None
    uploaded_at: Optional[datetime] = None
    status: str = "UPLOADED"
    bounds: Optional[dict[str, float]] = None
    job_id: Optional[str] = None
    feature_count: Optional[int] = 0
    notes: Optional[str] = None


class UploadImageResponse(BaseModel):
    image_id: str
    status: str = "UPLOADED"


class CreateJobRequest(BaseModel):
    image_id: str


class JobError(BaseModel):
    code: str
    message: str


class JobContract(BaseModel):
    job_id: str
    image_id: str
    filename: Optional[str] = None
    status: JobStatus
    stage: Optional[str] = None
    progress: int = Field(ge=0, le=100)
    stages: list[dict[str, Any]] = Field(default_factory=list)
    tiles_total: int = Field(default=0, ge=0)
    tiles_processed: int = Field(default=0, ge=0)
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[JobError] = None
    retry_supported: bool = True


class FeatureProperties(BaseModel):
    area_m2: float
    perimeter_m: Optional[float] = None
    length_m: Optional[float] = None
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_level: ConfidenceLevel
    status: FeatureStatus


class FeatureContract(BaseModel):
    feature_id: str
    image_id: str
    feature_type: FeatureType
    geometry: dict[str, Any]
    properties: FeatureProperties


class ReviewRequest(BaseModel):
    action: ReviewAction
    comment: Optional[str] = None
    reviewer_id: str = "user_demo"


class ReviewContract(BaseModel):
    review_id: str
    feature_id: str
    reviewer_id: str
    action: ReviewAction
    comment: Optional[str] = None
    timestamp: datetime


class AnalyticsSummary(BaseModel):
    building_count: int = 0
    building_area_m2: float = 0.0
    road_area_m2: float = 0.0
    waterbody_area_m2: float = 0.0
    average_building_area_m2: float = 0.0
    high_confidence_percentage: float = 0.0
    review_required_percentage: float = 0.0


class AnalyticsContract(BaseModel):
    image_id: str
    building_count: int = 0
    road_count: int = 0
    waterbody_count: int = 0
    total_features: int = 0
    built_up_area_m2: float = 0.0
    road_area_m2: float = 0.0
    road_length_m: float = 0.0
    waterbody_area_m2: float = 0.0
    average_building_area_m2: float = 0.0
    high_confidence_pct: float = 0.0
    medium_confidence_pct: float = 0.0
    low_confidence_pct: float = 0.0
    built_up_coverage_pct: float = 0.0
    feature_count_by_type: list[dict[str, Any]] = Field(default_factory=list)
    confidence_distribution: list[dict[str, Any]] = Field(default_factory=list)
    features_over_time: list[dict[str, Any]] = Field(default_factory=list)
    summary: Optional[AnalyticsSummary] = None


class DashboardSummary(BaseModel):
    total_images: int = 0
    total_jobs: int = 0
    total_features: int = 0
    high_confidence_pct: float = 0.0
    building_count: int = 0
    road_length_km: float = 0.0
    waterbody_count: int = 0


class ExportRequest(BaseModel):
    format: ExportFormat
    layers: list[FeatureType]


class ExportContract(BaseModel):
    export_id: str
    image_id: str
    format: ExportFormat
    layers: list[FeatureType]
    file_uri: str
    created_at: datetime
    filename: Optional[str] = None
    status: str = "COMPLETED"
    completed_at: Optional[datetime] = None
    download_url: Optional[str] = None
    feature_count: Optional[int] = None


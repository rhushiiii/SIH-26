export type FeatureType = "BUILDING" | "ROAD" | "WATERBODY";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type FeatureStatus =
  | "AUTO_ACCEPTED"
  | "REVIEW_RECOMMENDED"
  | "HUMAN_REVIEW_REQUIRED"
  | "ACCEPTED"
  | "REJECTED"
  | "EDITED";

export type RoofType = "RCC" | "TILED" | "TIN" | "OTHER";

export type JobStatus =
  | "QUEUED"
  | "VALIDATING"
  | "PREPROCESSING"
  | "INFERENCE"
  | "POSTPROCESSING"
  | "FINALIZING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type JobStageName =
  | "VALIDATING"
  | "PREPROCESSING"
  | "INFERENCE"
  | "POSTPROCESSING"
  | "FINALIZING";

export type ImageStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ReviewAction = "ACCEPT" | "REJECT" | "EDIT";

export type ExportFormat = "GeoJSON" | "CSV";

export type ExportStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiMeta {
  page?: number;
  page_size?: number;
  total?: number;
  request_id?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface FeatureProperties {
  area_m2?: number;
  perimeter_m?: number;
  length_m?: number;
  confidence: number;
  confidence_level: ConfidenceLevel;
  status: FeatureStatus;
  roof_type?: RoofType | null;
  roof_confidence?: number | null;
}

export interface Feature {
  feature_id: string;
  image_id: string;
  feature_type: FeatureType;
  geometry: GeoJSON.Geometry;
  properties: FeatureProperties;
}

export interface ImageRecord {
  image_id: string;
  filename: string;
  size_bytes: number;
  width: number;
  height: number;
  bands: number;
  crs: string;
  resolution_m: number;
  uploaded_at: string;
  status: ImageStatus;
  bounds: BBox;
  job_id?: string;
  feature_count?: number;
  notes?: string;
}

export interface JobStage {
  name: JobStageName;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  progress: number;
}

export interface Job {
  job_id: string;
  image_id: string;
  filename: string;
  status: JobStatus;
  progress: number;
  stage: JobStageName | "QUEUED" | "COMPLETED" | "FAILED" | "CANCELLED";
  stages: JobStage[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error?: ApiError | null;
  retry_supported: boolean;
  tiles_total?: number;
  tiles_processed?: number;
}

export interface Tile {
  tile_id: string;
  image_id: string;
  job_id: string;
  row: number;
  col: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
}

export interface Segmentation {
  segmentation_id: string;
  image_id: string;
  job_id: string;
  classes: FeatureType[];
  completed_at?: string;
}

export interface Analytics {
  image_id: string;
  building_count: number;
  road_count: number;
  waterbody_count: number;
  total_features: number;
  built_up_area_m2: number;
  road_area_m2: number;
  road_length_m: number;
  waterbody_area_m2: number;
  average_building_area_m2: number;
  high_confidence_pct: number;
  medium_confidence_pct: number;
  low_confidence_pct: number;
  built_up_coverage_pct: number;
  feature_count_by_type: { type: FeatureType; count: number }[];
  confidence_distribution: { bucket: string; count: number }[];
  features_over_time: { date: string; count: number }[];
}

export interface Review {
  review_id: string;
  feature_id: string;
  action: ReviewAction;
  comment: string;
  reviewer: string;
  created_at: string;
}

export interface ReviewRequest {
  action: ReviewAction;
  comment: string;
}

export interface ExportRecord {
  export_id: string;
  image_id: string;
  filename: string;
  format: ExportFormat;
  layers: FeatureType[];
  status: ExportStatus;
  created_at: string;
  completed_at?: string;
  download_url?: string;
  feature_count?: number;
}

export interface FeatureListParams {
  image_id?: string;
  type?: FeatureType | "ALL";
  status?: FeatureStatus | "ALL";
  confidence?: ConfidenceLevel | "ALL";
  q?: string;
  page?: number;
  page_size?: number;
}

export interface DashboardSummary {
  total_images: number;
  total_jobs: number;
  total_features: number;
  high_confidence_pct: number;
  building_count: number;
  road_length_km: number;
  waterbody_count: number;
}

export type ImageContract = ImageRecord;
export type JobContract = Job;
export type TileContract = Tile;
export type SegmentationContract = Segmentation;
export type FeatureContract = Feature;
export type AnalyticsContract = Analytics;
export type ReviewContract = Review;
export type ExportContract = ExportRecord;

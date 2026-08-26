import type {
  ConfidenceLevel,
  FeatureStatus,
  FeatureType,
  JobStageName,
  JobStatus,
} from "@/lib/types";

export const APP_NAME = "DRISHTI GeoAI";
export const APP_TAGLINE = "Orthophoto to GIS intelligence";

export const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export const PRIMARY_IMAGE_ID = "img_ortho_2024_05";

export const AOI_CENTER: [number, number] = [13.0452, 77.5124];
export const AOI_BOUNDS: [[number, number], [number, number]] = [
  [13.0382, 77.5048],
  [13.0524, 77.5206],
];

export const FEATURE_COLORS: Record<FeatureType, string> = {
  BUILDING: "#F59E0B",
  ROAD: "#F97316",
  WATERBODY: "#06B6D4",
};

export const FEATURE_LABELS: Record<FeatureType, string> = {
  BUILDING: "Building",
  ROAD: "Road",
  WATERBODY: "Waterbody",
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  HIGH: "#10B981",
  MEDIUM: "#F59E0B",
  LOW: "#EF4444",
};

export const JOB_STAGE_ORDER: JobStageName[] = [
  "VALIDATING",
  "PREPROCESSING",
  "INFERENCE",
  "POSTPROCESSING",
  "FINALIZING",
];

export const JOB_STAGE_COPY: Record<JobStageName, string> = {
  VALIDATING: "Raster validation & CRS check",
  PREPROCESSING: "Tiling and normalisation",
  INFERENCE: "AI segmentation",
  POSTPROCESSING: "Mask stitch & polygonize",
  FINALIZING: "GIS write & confidence score",
};

export const PIPELINE_STEPS = [
  "Raw image",
  "AI processing",
  "GIS features",
  "Confidence",
  "Human validation",
  "Map",
  "Export",
] as const;

export const STATUS_LABELS: Record<FeatureStatus, string> = {
  AUTO_ACCEPTED: "Auto-accepted",
  REVIEW_RECOMMENDED: "Review recommended",
  HUMAN_REVIEW_REQUIRED: "Human review required",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EDITED: "Edited",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  QUEUED: "Queued",
  VALIDATING: "Validating",
  PREPROCESSING: "Preprocessing",
  INFERENCE: "Inference",
  POSTPROCESSING: "Postprocessing",
  FINALIZING: "Finalizing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const SUPPORTED_UPLOAD_TYPES = [
  "image/tiff",
  "image/geotiff",
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

export const SUPPORTED_UPLOAD_EXTENSIONS = [
  ".tif",
  ".tiff",
  ".geotiff",
  ".png",
  ".jpg",
  ".jpeg",
] as const;

export const PAGE_SIZE = 20;

export const ANALYST_PROFILE = {
  name: "A. Sharma",
  role: "Senior GIS Analyst",
  org: "GeoAI Operations Cell",
  initials: "AS",
};

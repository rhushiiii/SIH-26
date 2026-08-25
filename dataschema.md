# Data Schema & API Contract — Drishti GeoAI

## 1. Contract Purpose

This document is the canonical communication contract between:

```text
Frontend
Backend
Preprocessing
CV/ML
GIS/Post-processing
```

Implementations may change internally, but these external data structures and API conventions must remain stable unless the API version is intentionally changed.

API base:

```text
/api/v1
```

---

## 2. Global Conventions

### 2.1 IDs

Use typed IDs:

```text
img_<id>
job_<id>
tile_<id>
feature_<id>
review_<id>
export_<id>
```

Recommended feature examples:

```text
building_000034
road_000012
waterbody_000004
```

IDs must be unique within their entity scope.

### 2.2 Confidence

```text
0.0 <= confidence <= 1.0
```

Thresholds:

```text
HIGH   >= 0.80
MEDIUM >= 0.60 and < 0.80
LOW    < 0.60
```

### 2.3 Units

```text
area_m2       → square metres
perimeter_m   → metres
length_m      → metres
resolution_m  → metres/pixel
```

Never expose raw pixel area as `area_m2`.

### 2.4 Coordinates

Internal processing may retain source CRS.

External GeoJSON output shall use:

```text
EPSG:4326 / WGS84
```

### 2.5 Nullability

Optional values must use:

```json
null
```

Do not use:

```text
""
"N/A"
"unknown"
```

---

# 3. Enumerations

## 3.1 Feature Types

```text
BUILDING
ROAD
WATERBODY
```

## 3.2 Confidence Levels

```text
HIGH
MEDIUM
LOW
```

## 3.3 Feature Status

```text
AUTO_ACCEPTED
REVIEW_RECOMMENDED
HUMAN_REVIEW_REQUIRED
ACCEPTED
REJECTED
EDITED
```

## 3.4 Job Status

```text
QUEUED
VALIDATING
PREPROCESSING
INFERENCE
POSTPROCESSING
FINALIZING
COMPLETED
FAILED
CANCELLED
```

## 3.5 Review Actions

```text
ACCEPT
REJECT
EDIT
```

## 3.6 Export Formats

```text
GEOJSON
CSV
```

---

# 4. Image Contract

```json
{
  "image_id": "img_001",
  "filename": "village_01.tif",
  "format": "GeoTIFF",
  "width": 12480,
  "height": 9360,
  "bands": 3,
  "dtype": "uint8",
  "crs": "EPSG:32643",
  "resolution_x_m": 0.5,
  "resolution_y_m": 0.5,
  "file_size_bytes": 184729381
}
```

### Required

```text
image_id
filename
format
width
height
bands
```

### Optional

```text
dtype
crs
resolution_x_m
resolution_y_m
file_size_bytes
```

---

# 5. Job Contract

```json
{
  "job_id": "job_001",
  "image_id": "img_001",
  "status": "INFERENCE",
  "stage": "MODEL_INFERENCE",
  "progress": 67,
  "tiles_total": 144,
  "tiles_processed": 96,
  "created_at": "2026-08-25T18:00:00Z",
  "started_at": "2026-08-25T18:01:02Z",
  "completed_at": null,
  "error": null
}
```

### Progress

```text
0 <= progress <= 100
```

### Stage

Recommended values:

```text
IMAGE_VALIDATION
TILE_GENERATION
MODEL_INFERENCE
MASK_STITCHING
POLYGONIZATION
FEATURE_FINALIZATION
```

---

# 6. Tile Contract

```json
{
  "tile_id": "tile_00023",
  "image_id": "img_001",
  "x": 1024,
  "y": 512,
  "width": 512,
  "height": 512,
  "overlap": 64,
  "sequence": 23
}
```

Coordinates `x` and `y` are pixel offsets in the original raster.

Default prototype:

```text
tile_size = 512
overlap = 64
```

---

# 7. Segmentation Contract

The model must support these class IDs:

```text
0 = BACKGROUND
1 = BUILDING
2 = ROAD
3 = WATERBODY
```

Example:

```json
{
  "tile_id": "tile_00023",
  "model_id": "unet_v1",
  "model_version": "1.0.0",
  "classes": [
    {
      "class_id": 1,
      "class_name": "BUILDING",
      "confidence": 0.93
    },
    {
      "class_id": 2,
      "class_name": "ROAD",
      "confidence": 0.81
    },
    {
      "class_id": 3,
      "class_name": "WATERBODY",
      "confidence": 0.76
    }
  ],
  "mask_uri": "img_001/masks/tile_00023.npy"
}
```

The mask artifact may be stored as NumPy, PNG, TIFF or another internal format; the API contract must expose its URI and metadata rather than forcing the frontend to read it.

---

# 8. Feature Contract

This is the primary shared contract between post-processing, backend and frontend.

```json
{
  "feature_id": "building_000034",
  "image_id": "img_001",
  "feature_type": "BUILDING",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [72.8791, 19.1241],
        [72.8795, 19.1241],
        [72.8795, 19.1245],
        [72.8791, 19.1245],
        [72.8791, 19.1241]
      ]
    ]
  },
  "properties": {
    "area_m2": 143.72,
    "perimeter_m": 49.13,
    "confidence": 0.94,
    "confidence_level": "HIGH",
    "status": "AUTO_ACCEPTED"
  }
}
```

### Required fields

```text
feature_id
image_id
feature_type
geometry
properties.area_m2
properties.confidence
properties.confidence_level
properties.status
```

### Geometry requirements

- Valid GeoJSON geometry.
- Output coordinates in EPSG:4326.
- Polygon rings must be closed.
- No self-intersections.
- Geometry must pass validation before being returned as accepted output.

---

# 9. Building Properties

Common properties plus:

```json
{
  "roof_type": "RCC",
  "roof_confidence": 0.88
}
```

Allowed roof types:

```text
RCC
TILED
TIN
OTHER
```

Both roof fields are optional for MVP.

---

# 10. Road Properties

```json
{
  "area_m2": 1210.5,
  "length_m": 480.4,
  "confidence": 0.91
}
```

Road representation may be polygonal for MVP. A future version may support centerline geometry.

---

# 11. Waterbody Properties

```json
{
  "area_m2": 5320.4,
  "perimeter_m": 312.1,
  "confidence": 0.87
}
```

---

# 12. Review Contract

```json
{
  "review_id": "review_001",
  "feature_id": "building_000034",
  "reviewer_id": "user_001",
  "action": "ACCEPT",
  "comment": "Boundary looks correct",
  "timestamp": "2026-08-25T18:21:04Z"
}
```

`reviewer_id` may be a temporary demo identifier in the prototype.

---

# 13. Analytics Contract

```json
{
  "image_id": "img_001",
  "summary": {
    "building_count": 1842,
    "building_area_m2": 482320.3,
    "road_area_m2": 91400.2,
    "waterbody_area_m2": 16820.6,
    "average_building_area_m2": 261.9,
    "high_confidence_percentage": 91.3,
    "review_required_percentage": 8.7
  }
}
```

---

# 14. Export Contract

```json
{
  "export_id": "export_001",
  "image_id": "img_001",
  "format": "GEOJSON",
  "layers": [
    "BUILDING",
    "ROAD",
    "WATERBODY"
  ],
  "file_uri": "/exports/export_001.zip",
  "created_at": "2026-08-25T18:30:00Z"
}
```

---

# 15. Error Contract

All public API errors must use:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Unsupported raster format"
  },
  "meta": {}
}
```

Recommended error codes:

```text
INVALID_IMAGE
IMAGE_NOT_FOUND
JOB_NOT_FOUND
JOB_ALREADY_RUNNING
PROCESSING_FAILED
MODEL_INFERENCE_FAILED
POLYGONIZATION_FAILED
INVALID_GEOMETRY
FEATURE_NOT_FOUND
REVIEW_FAILED
EXPORT_FAILED
UNSUPPORTED_FORMAT
```

---

# 16. API Response Envelope

All public endpoints use:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

For lists:

```json
{
  "success": true,
  "data": [],
  "error": null,
  "meta": {
    "count": 20,
    "page": 1,
    "page_size": 20
  }
}
```

---

# 17. Public API Contract

## Upload image

```http
POST /api/v1/images
Content-Type: multipart/form-data
```

Returns:

```json
{
  "success": true,
  "data": {
    "image_id": "img_001",
    "status": "UPLOADED"
  },
  "error": null,
  "meta": {}
}
```

## Get image

```http
GET /api/v1/images/{image_id}
```

## Start processing

```http
POST /api/v1/jobs
Content-Type: application/json
```

Request:

```json
{
  "image_id": "img_001"
}
```

## Get job

```http
GET /api/v1/jobs/{job_id}
```

## Cancel job

```http
POST /api/v1/jobs/{job_id}/cancel
```

## Get features

```http
GET /api/v1/images/{image_id}/features
```

## Get single feature

```http
GET /api/v1/images/{image_id}/features/{feature_id}
```

## Get analytics

```http
GET /api/v1/images/{image_id}/analytics
```

## Review feature

```http
POST /api/v1/features/{feature_id}/review
```

Request:

```json
{
  "action": "ACCEPT",
  "comment": "Boundary verified"
}
```

## Create export

```http
POST /api/v1/images/{image_id}/exports
```

Request:

```json
{
  "format": "GEOJSON",
  "layers": [
    "BUILDING",
    "ROAD",
    "WATERBODY"
  ]
}
```

## Get export

```http
GET /api/v1/exports/{export_id}
```

---

# 18. Internal Interface Contracts

These are not frontend APIs. They are internal module boundaries.

### Preprocessing → CV

Input:

```text
TileContract
```

Output:

```text
tile image tensor / model-ready tile
+
tile metadata
```

### CV → Post-processing

Input:

```text
SegmentationContract
```

Output artifacts:

```text
mask
class probabilities
model metadata
tile metadata
```

### Post-processing → Backend

Input:

```text
FeatureContract[]
```

### Backend → Frontend

Input:

```text
ImageContract
JobContract
FeatureContract[]
AnalyticsContract
ReviewContract
ExportContract
```

---

# 19. Contract Compatibility Rules

1. Do not rename required fields without updating all consumers.
2. Do not change enum values casually.
3. Do not change units.
4. Do not expose Python-specific objects.
5. Do not make frontend depend on filesystem paths for model artifacts.
6. Use URIs for internal artifacts.
7. Maintain API versioning.
8. Backward-compatible optional fields are preferred over breaking changes.
9. Any breaking change requires `/api/v2`.

---

# 20. Mock Data Requirement

Every contract must have at least one valid mock example.

Mock data is mandatory for parallel development so frontend/backend can develop before the real CV pipeline is complete.

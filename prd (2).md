# PRD — Drishti GeoAI

## 1. Product Overview

**Product:** Drishti GeoAI  
**Prototype Goal:** Convert drone orthophotos of rural areas into structured, GIS-ready village intelligence using AI-based semantic segmentation.

### Core flow

```text
Drone Orthophoto
      ↓
Image Validation
      ↓
Tiling / Preprocessing
      ↓
AI Segmentation
      ↓
Building / Road / Water Masks
      ↓
Mask Stitching + Post-processing
      ↓
Polygon Generation
      ↓
GIS Feature Extraction
      ↓
Confidence Evaluation
      ↓
Human Review
      ↓
Interactive GIS Dashboard
      ↓
GeoJSON / CSV Export
```

The SIH presentation defines the core extracted layers as buildings, roads and waterbodies, with GIS-ready vector outputs, confidence-aware processing, human validation and dashboard integration.

---

## 2. Problem Statement

Manual interpretation and digitization of rural drone imagery is slow, costly and error-prone. The system should automate extraction of important spatial features from orthophotos and convert them into structured GIS data suitable for downstream village planning and property-related workflows.

The prototype must demonstrate the transformation:

```text
Raw orthophoto
    ↓
AI feature extraction
    ↓
Structured GIS features
    ↓
Interactive visualization
    ↓
Exportable GIS data
```

---

## 3. Goals

### Primary goals

1. Accept drone orthophotos as input.
2. Validate image metadata and geographic reference information.
3. Tile large orthophotos for memory-efficient processing.
4. Segment:
   - BUILDING
   - ROAD
   - WATERBODY
5. Stitch tile predictions back into the full image.
6. Convert masks into valid GIS polygons.
7. Calculate area, perimeter, centroid and confidence.
8. Classify confidence as HIGH / MEDIUM / LOW.
9. Route low-confidence features to human review.
10. Display features on an interactive map.
11. Provide village-level analytics.
12. Export GeoJSON and CSV.

---

## 4. MVP Non-Goals

The following are explicitly outside the first prototype scope:

- Multi-model architecture benchmarking.
- Active-learning retraining loop.
- Production-scale PostGIS deployment.
- TensorRT optimization.
- INT8/FP16 optimization.
- Cloud autoscaling.
- Multi-village distributed processing.
- Advanced roof-type classification unless a usable model/data source already exists.
- Legal/cadastral record generation.
- Claiming a target accuracy without a valid evaluation dataset.

These may be future phases.

---

## 5. Users

### Primary user — Government / GIS / Survey Operator

Needs to upload an orthophoto, process it, inspect extracted features, review uncertain predictions, view measurements and export GIS data.

### Secondary user — Village Planner / Local Administration

Needs village-level statistics, spatial layers and structured building/road/water information for planning workflows.

---

## 6. Functional Requirements

### FR-01 — Orthophoto upload

System shall support:

- GeoTIFF
- TIFF
- PNG
- JPG/JPEG

GeoTIFF is the preferred input because CRS/geotransform information can be preserved.

### FR-02 — Image validation

System shall extract:

- image dimensions
- band count
- data type
- CRS if present
- geographic transform if present
- pixel resolution if available
- file size

Invalid or unreadable files shall produce a structured API error.

### FR-03 — Tiling

Large orthophotos shall be divided into manageable overlapping tiles.

Default prototype configuration:

```text
tile_size = 512 px
overlap = 64 px
```

Tile placement must preserve the relationship to the original image so that predictions can be reconstructed.

### FR-04 — Semantic segmentation

The segmentation output shall support:

```text
0 = BACKGROUND
1 = BUILDING
2 = ROAD
3 = WATERBODY
```

The model implementation shall remain replaceable. The prototype may use U-Net or another compatible segmentation architecture.

### FR-05 — Mask post-processing

The prototype shall support:

```text
model probabilities
    ↓
class thresholding
    ↓
morphological cleanup
    ↓
connected components / contours
    ↓
polygon generation
    ↓
geometry validation
```

### FR-06 — GIS feature generation

Each accepted detected feature shall contain:

- feature ID
- image ID
- feature type
- valid geometry
- area
- perimeter where applicable
- centroid
- confidence
- confidence level
- processing/review status

### FR-07 — Confidence-aware processing

Default prototype thresholds:

```text
HIGH   >= 0.80
MEDIUM >= 0.60 and < 0.80
LOW    < 0.60
```

Default routing:

```text
HIGH   → AUTO_ACCEPTED
MEDIUM → REVIEW_RECOMMENDED
LOW    → HUMAN_REVIEW_REQUIRED
```

### FR-08 — Human validation

Reviewer shall be able to:

- Accept
- Reject
- Edit

MVP may initially implement Accept and Reject only.

Every review action shall be persisted using the review contract.

### FR-09 — GIS dashboard

Dashboard shall include:

- orthophoto/map
- building layer
- road layer
- waterbody layer
- layer visibility controls
- feature selection
- feature details
- confidence/status indication

### FR-10 — Analytics

Dashboard shall display:

- total buildings
- total building area
- total road area
- total waterbody area
- average building area
- high-confidence percentage
- review-required percentage

### FR-11 — Export

System shall support:

```text
GeoJSON
CSV
```

GeoJSON shall use the agreed geographic output convention.

---

## 7. Product Architecture

```text
                    ┌───────────────────┐
                    │     Next.js       │
                    │    Frontend       │
                    └─────────┬─────────┘
                              │
                           REST API
                              │
                    ┌─────────▼─────────┐
                    │      FastAPI      │
                    │ API + Job Manager │
                    └─────────┬─────────┘
                              │
                    Internal Processing
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        Preprocessing        CV/ML          GIS/Postprocess
        Rasterio             PyTorch         GeoPandas
        Tiling               Model           Shapely
              └───────────────┼────────────────┘
                              ▼
                       Feature Results
                              │
                              ▼
                         REST API
                              │
                              ▼
                         Next.js Map
```

### Architectural rule

The frontend must **never directly call internal CV, preprocessing or GIS modules**.

Frontend talks only to versioned public APIs:

```text
/api/v1/images
/api/v1/jobs
/api/v1/features
/api/v1/analytics
/api/v1/reviews
/api/v1/exports
```

Internal pipeline implementations can change without requiring frontend changes.

---

## 8. Integration Contract

The following contracts are mandatory shared interfaces:

```text
ImageContract
JobContract
TileContract
SegmentationContract
FeatureContract
AnalyticsContract
ReviewContract
ExportContract
ErrorContract
```

The canonical definitions are maintained in `dataschema.md`.

### Contract rules

1. API version is `/api/v1`.
2. Feature types use fixed enums.
3. Confidence is always in `[0.0, 1.0]`.
4. Areas are in square metres.
5. GeoJSON output is WGS84 / EPSG:4326.
6. Job states use the fixed state machine in `dataschema.md`.
7. IDs are unique and typed by prefix.
8. Optional properties are `null`, not arbitrary strings.
9. API responses use the common response envelope.
10. Frontend uses only public API contracts.

---

## 9. API Requirements

### Images

```http
POST /api/v1/images
GET  /api/v1/images/{image_id}
```

### Processing jobs

```http
POST /api/v1/jobs
GET  /api/v1/jobs/{job_id}
POST /api/v1/jobs/{job_id}/cancel
```

### Features

```http
GET /api/v1/images/{image_id}/features
GET /api/v1/images/{image_id}/features/{feature_id}
```

### Analytics

```http
GET /api/v1/images/{image_id}/analytics
```

### Review

```http
POST /api/v1/features/{feature_id}/review
```

### Export

```http
POST /api/v1/images/{image_id}/exports
GET  /api/v1/exports/{export_id}
```

---

## 10. Common API Response Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Error:

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

---

## 11. Job Lifecycle

```text
QUEUED
  ↓
VALIDATING
  ↓
PREPROCESSING
  ↓
INFERENCE
  ↓
POSTPROCESSING
  ↓
FINALIZING
  ↓
COMPLETED
```

Any stage may transition to:

```text
FAILED
```

Optional cancellation state:

```text
CANCELLED
```

The job status API shall expose current stage and progress.

---

## 12. Non-Functional Requirements

### Reliability

A failed tile or stage must result in a structured error rather than silently producing partial output.

### Traceability

Every result must be traceable to:

```text
image_id
job_id
model_id where applicable
```

### Determinism

Given the same input, model version and processing configuration, the pipeline should produce reproducible results where practical.

### Maintainability

CV/model implementation must remain replaceable through a stable inference interface.

### Performance

The prototype should use tiled processing so large orthophotos do not require loading the entire raster into model memory.

---

## 13. Definition of Done

The MVP is complete when a user can:

```text
[ ] Upload a GeoTIFF
[ ] Validate image metadata
[ ] Start a processing job
[ ] Observe job progress
[ ] Produce building/road/water predictions
[ ] Convert masks into polygons
[ ] Calculate GIS attributes
[ ] Assign confidence
[ ] View results on an interactive map
[ ] Inspect an individual feature
[ ] Review a low-confidence feature
[ ] View village-level statistics
[ ] Export GeoJSON
[ ] Export CSV
```

The final demonstration must work end-to-end without requiring the user to manually execute Python scripts.

---

## 14. Future Phases

Potential future work:

```text
Phase 2
- better domain fine-tuning
- roof classification
- model benchmarking

Phase 3
- active learning
- PostGIS
- multi-village processing

Phase 4
- ONNX / TensorRT
- quantization
- cloud deployment
- large-scale integration
```

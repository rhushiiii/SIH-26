# Parallel Implementation Plan — Drishti GeoAI Prototype

## 1. Objective

Build the working GeoAI prototype through five parallel workstreams:

```text
P1 → Frontend
P2 → Backend / API / Job orchestration
P3 → Backend / GIS / Results / Export
P4 → CV / ML
P5 → Data preprocessing / Post-processing / GIS geometry
```

The implementation is intentionally contract-first so all five people can work simultaneously and integrate without changing interfaces.

---

# 2. Golden Architecture Rule

Each layer communicates through a stable contract.

```text
                 ┌─────────────────┐
                 │   P1 FRONTEND   │
                 └────────┬────────┘
                          │
                     Public API
                          │
                 ┌────────▼────────┐
                 │   P2 + P3 API   │
                 └────────┬────────┘
                          │
                     Job / Files
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
        ┌───────────┐           ┌───────────┐
        │    P5     │           │    P4     │
        │ Preprocess│──────────►│ CV / Model│
        │ + GIS     │ Tile      │ Inference │
        └─────┬─────┘ Contract  └─────┬─────┘
              │                       │
              └────── Mask / Feature ─┘
                         Contract
```

### Never do this

```text
Frontend → Python CV function
Frontend → filesystem
Frontend → model file
Backend → undocumented CV object
CV → direct database writes
```

### Always do this

```text
Frontend → Public API
Backend → Internal contracts
CV → Segmentation contract
Post-processing → Feature contract
```

---

# 3. Team Ownership

| Person | Role | Primary ownership |
|---|---|---|
| P1 | Frontend | Next.js dashboard, map, upload, review, analytics UI |
| P2 | Backend/API | FastAPI, image API, job API, orchestration, errors |
| P3 | Backend/GIS | Feature API, analytics, review API, GeoJSON/CSV export |
| P4 | CV/ML | Segmentation model, inference engine, model configuration |
| P5 | Data/CV-GIS | GeoTIFF processing, tiling, normalization, stitching, polygonization, geometry validation |

---

# 4. Repository Structure

```text
drishti-geoai/
│
├── contracts/
│   ├── examples/
│   └── schemas/
│
├── backend/
│   ├── api/
│   ├── services/
│   ├── orchestration/
│   ├── models/
│   └── main.py
│
├── cv/
│   ├── models/
│   ├── inference/
│   ├── configs/
│   └── tests/
│
├── preprocessing/
│   ├── raster/
│   ├── tiling/
│   ├── stitching/
│   ├── polygonization/
│   └── validation/
│
├── frontend/
│   └── nextjs/
│
├── data/
│   ├── input/
│   ├── tiles/
│   ├── masks/
│   ├── polygons/
│   └── exports/
│
├── tests/
│   ├── contracts/
│   ├── integration/
│   └── fixtures/
│
└── docker-compose.yml
```

---

# 5. Contract-First Setup

Before parallel coding begins, the team must freeze:

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

Canonical definitions live in:

```text
dataschema.md
```

### Freeze these values

```text
API version = /api/v1

Feature types:
BUILDING
ROAD
WATERBODY

Confidence:
0.0 → 1.0

Units:
area → m²
length/perimeter → m

GeoJSON:
EPSG:4326

Tile:
512 × 512
64 px overlap
```

No developer should change these contracts independently.

---

# 6. Workstream P1 — Frontend

## Scope

Build the complete dashboard against mock APIs first.

### Pages/components

```text
Upload
Processing status
Map dashboard
Layer controls
Feature details
Analytics
Human review
Export
```

### Responsibilities

- Next.js application
- map integration
- upload UI
- job progress UI
- feature rendering
- feature popup/panel
- confidence indicators
- review UI
- statistics cards
- export controls

### Does not own

- model inference
- GeoTIFF processing
- polygonization
- database internals
- image processing

---

# 7. P1 Development Strategy

P1 starts immediately with:

```text
mock/images.json
mock/jobs.json
mock/features.json
mock/analytics.json
```

The frontend should be fully navigable before real backend integration.

Example:

```text
GET /api/v1/images/img_001/features
```

can initially return fixture data.

When P3 provides the real endpoint, P1 only changes the API base URL/configuration.

---

# 8. Workstream P2 — Backend/API

## Scope

P2 owns the external API and job orchestration.

### APIs

```http
POST /api/v1/images
GET  /api/v1/images/{image_id}

POST /api/v1/jobs
GET  /api/v1/jobs/{job_id}
POST /api/v1/jobs/{job_id}/cancel
```

### Responsibilities

- FastAPI application
- upload handling
- image metadata validation
- job creation
- job state machine
- progress reporting
- pipeline orchestration
- structured errors
- artifact paths/URIs
- API response envelope

### P2 must not

- implement model architecture
- perform polygonization in API routes
- write frontend-specific response shapes
- expose internal processing modules directly

---

# 9. Workstream P3 — Backend/GIS/Results

## APIs

```http
GET  /api/v1/images/{image_id}/features
GET  /api/v1/images/{image_id}/features/{feature_id}
GET  /api/v1/images/{image_id}/analytics
POST /api/v1/features/{feature_id}/review
POST /api/v1/images/{image_id}/exports
GET  /api/v1/exports/{export_id}
```

### Responsibilities

- feature persistence
- feature retrieval
- analytics aggregation
- review state
- GeoJSON generation
- CSV generation
- export packaging
- API-level filtering

### P3 consumes

```text
FeatureContract[]
```

P3 should not need to know how the model produced the feature.

---

# 10. Workstream P4 — CV/ML

## Scope

Implement the model behind a stable inference interface.

### Required interface

```python
class InferenceEngine:
    def predict(self, tile, tile_metadata):
        ...
```

### Initial implementations

```text
MockInferenceEngine
RealSegmentationEngine
```

The backend can initially use the mock engine while P4 develops the real model.

### Output

P4 returns the SegmentationContract:

```text
tile_id
model_id
model_version
class outputs
confidence/probability information
mask artifact URI
```

### P4 does not own

- API routes
- frontend
- GeoJSON
- job orchestration
- database
- final feature geometry

---

# 11. Workstream P5 — Data Preprocessing + GIS

## Input

```text
ImageContract
```

## Pipeline

```text
GeoTIFF
 ↓
read metadata
 ↓
validate raster
 ↓
tile
 ↓
normalize
 ↓
create TileContract
 ↓
send to inference
 ↓
receive segmentation results
 ↓
stitch masks
 ↓
threshold / clean
 ↓
polygonize
 ↓
validate geometry
 ↓
calculate GIS attributes
 ↓
produce FeatureContract[]
```

### P5 owns

- Rasterio/GDAL interaction
- tiling
- tile manifests
- normalization
- stitching
- polygonization
- geometry validation
- feature-level GIS calculations

### P5 does not own

- public API routes
- React UI
- model architecture

---

# 12. Shared Artifact Directory Contract

For an image:

```text
data/
└── img_001/
    ├── original/
    │   └── village_01.tif
    │
    ├── tiles/
    │   ├── tile_00001.*
    │   └── tile_00002.*
    │
    ├── masks/
    │   ├── tile_00001.*
    │   └── tile_00002.*
    │
    ├── polygons/
    │   ├── buildings.geojson
    │   ├── roads.geojson
    │   └── waterbodies.geojson
    │
    └── exports/
```

Do not hardcode machine-specific absolute paths into contracts.

---

# 13. Mock-First Integration Strategy

Each major dependency must have a mock implementation.

```text
Frontend
   ↓
Mock API

Backend
   ↓
Mock pipeline

P5
   ↓
Synthetic masks

P4
   ↓
Mock inference
```

This allows all five developers to work simultaneously.

The real components can later replace mocks without API changes.

---

# 14. Integration Checkpoints

## Checkpoint 0 — Contracts frozen

Verify:

```text
[ ] schemas agreed
[ ] enums agreed
[ ] API paths agreed
[ ] units agreed
[ ] CRS convention agreed
[ ] job states agreed
```

Do this before major coding.

---

## Checkpoint 1 — Frontend ↔ Backend

Working flow:

```text
Upload
 ↓
Image ID
 ↓
Create Job
 ↓
Job Status
```

At this checkpoint the CV pipeline can still be fake.

---

## Checkpoint 2 — Backend ↔ Preprocessing

Working flow:

```text
Uploaded image
 ↓
P2 starts job
 ↓
P5 validates image
 ↓
P5 generates tiles
 ↓
job progress updates
```

---

## Checkpoint 3 — Preprocessing ↔ CV

Working flow:

```text
TileContract
 ↓
P4 inference
 ↓
SegmentationContract
 ↓
P5
```

This is the key AI boundary.

---

## Checkpoint 4 — CV ↔ GIS

Working flow:

```text
SegmentationContract
 ↓
mask stitching
 ↓
polygonization
 ↓
FeatureContract[]
```

---

## Checkpoint 5 — Backend ↔ Frontend

Working flow:

```text
FeatureContract[]
 ↓
API
 ↓
Next.js
 ↓
Map
```

---

## Checkpoint 6 — Full End-to-End

Final path:

```text
User
 ↓
Next.js
 ↓
FastAPI
 ↓
Job
 ↓
Preprocessing
 ↓
Real Model
 ↓
Post-processing
 ↓
Feature Results
 ↓
Analytics
 ↓
Map
 ↓
GeoJSON
```

---

# 15. Job State Machine

The orchestrator owned by P2 should use:

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

Any stage may enter:

```text
FAILED
```

User cancellation may result in:

```text
CANCELLED
```

Frontend displays stage and progress using the JobContract.

---

# 16. Progress Reporting

Example:

```json
{
  "job_id": "job_001",
  "status": "INFERENCE",
  "stage": "MODEL_INFERENCE",
  "progress": 67,
  "tiles_total": 144,
  "tiles_processed": 96
}
```

P1 can use this directly for the processing screen.

---

# 17. API Integration Rules

### Rule 1

Frontend only talks to:

```text
/api/v1/images
/api/v1/jobs
/api/v1/features
/api/v1/analytics
/api/v1/reviews
/api/v1/exports
```

### Rule 2

Frontend never imports Python code.

### Rule 3

P4 never writes directly to frontend-facing APIs.

### Rule 4

P5 never requires the frontend to understand masks.

### Rule 5

P3 accepts FeatureContract rather than custom CV objects.

### Rule 6

All API responses use the common envelope.

### Rule 7

Breaking schema changes require a new API version.

---

# 18. Recommended Python Interfaces

## Preprocessor

```python
class Preprocessor:
    def prepare(self, image_path) -> list[TileContract]:
        ...
```

## Inference

```python
class InferenceEngine:
    def predict(self, tile) -> SegmentationResult:
        ...
```

## Postprocessor

```python
class Postprocessor:
    def build_features(self, segmentation_results) -> list[Feature]:
        ...
```

## Exporter

```python
class ExportService:
    def export_geojson(self, features):
        ...
```

These boundaries allow individual team members to test their modules independently.

---

# 19. Testing Strategy

## P1

- component tests
- mock API tests
- map rendering tests

## P2

- API tests
- upload validation tests
- job state tests
- error response tests

## P3

- feature schema tests
- analytics tests
- export validity tests
- review state tests

## P4

- model loading test
- inference shape test
- class mapping test
- confidence range test

## P5

- raster metadata test
- tiling test
- stitching test
- polygon validity test
- CRS transformation test

---

# 20. Contract Tests

Create shared fixtures in:

```text
tests/fixtures/
```

Examples:

```text
image_valid.json
job_processing.json
tile_valid.json
segmentation_valid.json
feature_building.json
analytics_valid.json
review_accept.json
export_geojson.json
error_invalid_image.json
```

All layers should validate against the same fixtures.

---

# 21. Development Order for a Few-Hour Prototype

## Stage 0 — 20–30 minutes

Everyone together:

```text
freeze repository structure
freeze contracts
freeze API paths
freeze class IDs
freeze confidence thresholds
freeze CRS/output conventions
```

## Stage 1 — Parallel

P1:
```text
Dashboard + mock data
```

P2:
```text
FastAPI + upload + jobs
```

P3:
```text
Feature + analytics + export APIs
```

P4:
```text
Inference engine + model
```

P5:
```text
Raster + tiling + polygonization
```

## Stage 2

Integrate:

```text
P1 ↔ P2
P2 ↔ P5
P5 ↔ P4
P5 ↔ P3
P3 ↔ P1
```

## Stage 3

Run one real image end-to-end.

## Stage 4

Only after the end-to-end path is working, add:

```text
confidence review
analytics polish
CSV export
UI polish
```

---

# 22. Critical Integration Rule

Do not attempt final integration for the first time at the end.

The system must be integrated incrementally:

```text
Contract
  ↓
Mock
  ↓
Interface test
  ↓
Real implementation
  ↓
Integration
```

This prevents the common hackathon failure mode where all five components work independently but cannot communicate.

---

# 23. Definition of Done by Person

## P1

```text
[ ] Upload UI
[ ] Processing UI
[ ] Interactive map
[ ] Building/road/water layers
[ ] Feature popup
[ ] Analytics cards
[ ] Review UI
[ ] Export buttons
```

## P2

```text
[ ] Image upload endpoint
[ ] Image validation
[ ] Job creation
[ ] Job state machine
[ ] Progress API
[ ] Structured errors
[ ] Pipeline orchestration
```

## P3

```text
[ ] Feature API
[ ] Analytics API
[ ] Review API
[ ] GeoJSON export
[ ] CSV export
[ ] Result filtering
```

## P4

```text
[ ] Model loads
[ ] Tile inference works
[ ] Class IDs match contract
[ ] Confidence generated
[ ] SegmentationContract generated
[ ] Mock/real inference interchangeable
```

## P5

```text
[ ] GeoTIFF validation
[ ] Tiling
[ ] Tile metadata
[ ] Mask stitching
[ ] Polygonization
[ ] Geometry validation
[ ] GIS measurements
[ ] FeatureContract generated
```

---

# 24. Final Integration Acceptance Test

Use one representative orthophoto.

Expected flow:

```text
1. Upload image
2. Image gets img_xxx
3. Job gets job_xxx
4. Job enters VALIDATING
5. Image is tiled
6. Job enters INFERENCE
7. CV processes tiles
8. Masks are stitched
9. Features are polygonized
10. Confidence is calculated
11. GeoJSON features are generated
12. Job enters COMPLETED
13. Frontend displays map layers
14. User clicks a building
15. User sees area/perimeter/confidence
16. Low-confidence feature appears in review
17. User accepts/rejects it
18. GeoJSON export succeeds
19. CSV export succeeds
20. Analytics match feature data
```

If all 20 steps pass, the prototype is considered integrated.

---

# 25. Final Team Rule

The team should optimize for this:

```text
          PARALLEL DEVELOPMENT

       P1 ───────────────┐
                         │
       P2 ───────────────┤
                         │
       P3 ───────────────┤
                         │
       P4 ───────────────┤
                         │
       P5 ───────────────┘
                │
                ▼
        COMMON CONTRACTS
                │
                ▼
       INCREMENTAL INTEGRATION
                │
                ▼
          WORKING MVP
```

The success criterion is not that every subsystem is production-ready. It is that the five workstreams can be developed independently, connected through the agreed contracts, and produce one reliable end-to-end demonstration.

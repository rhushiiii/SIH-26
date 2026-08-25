# Drishti GeoAI Backend - P2

This backend implements the P2 scope from the project plan:

- FastAPI application
- image upload and metadata validation
- image lookup
- processing job creation
- job state/progress lookup
- job cancellation
- structured API response envelopes

It also includes the P3 API/database slice:

- PostGIS schema for feature, review and export storage
- feature retrieval APIs
- analytics API
- review API
- GeoJSON/CSV export APIs

The CV/GIS pipeline is currently represented by a mock job runner so the frontend and downstream teams can integrate against stable `/api/v1` contracts.

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

From the `backend/` directory, the API will be available at:

```text
http://127.0.0.1:8000
```

Interactive docs:

```text
http://127.0.0.1:8000/docs
```

## P2 Endpoints

```http
POST /api/v1/images
GET  /api/v1/images/{image_id}
POST /api/v1/jobs
GET  /api/v1/jobs/{job_id}
POST /api/v1/jobs/{job_id}/cancel
```

## P3 Endpoints

```http
GET  /api/v1/images/{image_id}/features
GET  /api/v1/images/{image_id}/features/{feature_id}
GET  /api/v1/images/{image_id}/analytics
POST /api/v1/features/{feature_id}/review
POST /api/v1/images/{image_id}/exports
GET  /api/v1/exports/{export_id}
```

## Database

By default the app uses a local SQLite database at `backend/data/drishti.db` so the API can run immediately.

For PostGIS, start the database:

```bash
docker compose up -d postgis
```

Then run the API with:

```bash
set DATABASE_URL=postgresql+psycopg://drishti:drishti@127.0.0.1:5432/drishti_geoai
uvicorn app.main:app --reload
```

The PostGIS schema lives at `app/migrations/001_postgis_schema.sql`.

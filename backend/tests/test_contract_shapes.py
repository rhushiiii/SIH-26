from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


client = TestClient(app)


def test_missing_image_uses_error_envelope():
    response = client.get("/api/v1/images/img_missing")

    assert response.status_code == 404
    assert response.json() == {
        "success": False,
        "data": None,
        "error": {
            "code": "IMAGE_NOT_FOUND",
            "message": "Image not found",
        },
        "meta": {},
    }


def test_missing_job_uses_error_envelope():
    response = client.get("/api/v1/jobs/job_missing")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "JOB_NOT_FOUND"


def test_upload_image_and_create_job_flow():
    buffer = BytesIO()
    Image.new("RGB", (4, 3), color=(30, 90, 120)).save(buffer, format="PNG")
    buffer.seek(0)

    upload_response = client.post(
        "/api/v1/images",
        files={"file": ("village.png", buffer, "image/png")},
    )

    assert upload_response.status_code == 200
    upload_body = upload_response.json()
    assert upload_body["success"] is True
    assert upload_body["data"]["status"] == "UPLOADED"

    image_id = upload_body["data"]["image_id"]
    image_response = client.get(f"/api/v1/images/{image_id}")
    image_body = image_response.json()
    assert image_body["data"]["filename"] == "village.png"
    assert image_body["data"]["width"] == 4
    assert image_body["data"]["height"] == 3
    assert image_body["data"]["bands"] == 3

    job_response = client.post("/api/v1/jobs", json={"image_id": image_id})
    assert job_response.status_code == 200
    job_body = job_response.json()
    assert job_body["success"] is True
    assert job_body["data"]["image_id"] == image_id
    assert job_body["data"]["job_id"].startswith("job_")

    job_id = job_body["data"]["job_id"]
    fetched_job = client.get(f"/api/v1/jobs/{job_id}")
    assert fetched_job.status_code == 200
    assert fetched_job.json()["data"]["progress"] >= 0


def test_p3_feature_analytics_review_and_export_flow():
    buffer = BytesIO()
    Image.new("RGB", (4, 3), color=(30, 90, 120)).save(buffer, format="PNG")
    buffer.seek(0)

    upload_response = client.post(
        "/api/v1/images",
        files={"file": ("village-p3.png", buffer, "image/png")},
    )
    image_id = upload_response.json()["data"]["image_id"]

    client.post("/api/v1/jobs", json={"image_id": image_id})

    features_response = client.get(f"/api/v1/images/{image_id}/features")
    features_body = features_response.json()
    assert features_response.status_code == 200
    assert features_body["success"] is True
    assert features_body["meta"]["count"] == 3

    feature_id = features_body["data"][0]["feature_id"]
    single_feature_response = client.get(f"/api/v1/images/{image_id}/features/{feature_id}")
    assert single_feature_response.status_code == 200
    assert single_feature_response.json()["data"]["geometry"]["type"] == "Polygon"

    analytics_response = client.get(f"/api/v1/images/{image_id}/analytics")
    analytics_body = analytics_response.json()
    assert analytics_body["data"]["summary"]["building_count"] == 1
    assert analytics_body["data"]["summary"]["review_required_percentage"] > 0

    review_response = client.post(
        f"/api/v1/features/{feature_id}/review",
        json={"action": "ACCEPT", "comment": "Looks correct"},
    )
    assert review_response.status_code == 200
    assert review_response.json()["data"]["action"] == "ACCEPT"

    export_response = client.post(
        f"/api/v1/images/{image_id}/exports",
        json={"format": "GEOJSON", "layers": ["BUILDING", "ROAD", "WATERBODY"]},
    )
    export_body = export_response.json()
    assert export_response.status_code == 200
    assert export_body["data"]["file_uri"].endswith(".geojson")

    fetched_export = client.get(f"/api/v1/exports/{export_body['data']['export_id']}")
    assert fetched_export.status_code == 200
    assert fetched_export.json()["data"]["image_id"] == image_id

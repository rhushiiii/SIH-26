from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.contracts.envelope import ok
from app.db.session import get_db
from app.gis.analytics_service import analytics_service
from app.services.image_service import image_service
from app.services.job_service import job_service

router = APIRouter(tags=["analytics"])


@router.get("/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db)):
    images_count = len(image_service.list_images())
    jobs_count = len(job_service.list_jobs())
    summary = analytics_service.build_dashboard(db, images_count, jobs_count)
    return ok(summary.model_dump(mode="json"))


@router.get("/images/{image_id}/analytics")
def get_analytics(image_id: str, db: Session = Depends(get_db)):
    analytics = analytics_service.build_for_image(db, image_id)
    return ok(analytics.model_dump(mode="json"))


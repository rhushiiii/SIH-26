from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.contracts.envelope import ok
from app.db.session import get_db
from app.gis.analytics_service import analytics_service

router = APIRouter(tags=["analytics"])


@router.get("/images/{image_id}/analytics")
def get_analytics(image_id: str, db: Session = Depends(get_db)):
    analytics = analytics_service.build_for_image(db, image_id)
    return ok(analytics.model_dump(mode="json"))

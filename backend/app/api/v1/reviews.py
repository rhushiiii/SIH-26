from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.contracts.envelope import ok
from app.contracts.schemas import ReviewRequest
from app.db.session import get_db
from app.gis.review_service import review_service

router = APIRouter(prefix="/features", tags=["reviews"])


@router.post("/{feature_id}/review")
def review_feature(feature_id: str, request: ReviewRequest, db: Session = Depends(get_db)):
    review = review_service.review_feature(db, feature_id, request)
    return ok(review.model_dump(mode="json"))

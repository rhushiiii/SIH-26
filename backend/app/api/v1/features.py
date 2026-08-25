from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.contracts.envelope import ok
from app.contracts.schemas import FeatureStatus, FeatureType
from app.db.session import get_db
from app.gis.feature_service import feature_service

router = APIRouter(tags=["features"])


@router.get("/images/{image_id}/features")
def list_features(
    image_id: str,
    feature_type: FeatureType | None = Query(default=None),
    status: FeatureStatus | None = Query(default=None),
    db: Session = Depends(get_db),
):
    features = feature_service.list_features(db, image_id, feature_type, status)
    return ok(
        [feature.model_dump(mode="json") for feature in features],
        meta={"count": len(features)},
    )


@router.get("/images/{image_id}/features/{feature_id}")
def get_feature(image_id: str, feature_id: str, db: Session = Depends(get_db)):
    feature = feature_service.get_feature(db, image_id, feature_id)
    return ok(feature.model_dump(mode="json"))

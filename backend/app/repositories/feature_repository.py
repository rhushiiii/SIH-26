import json
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.contracts.schemas import (
    FeatureContract,
    FeatureProperties,
    FeatureStatus,
    FeatureType,
)
from app.db.models import FeatureModel


class FeatureRepository:
    def list_by_image(
        self,
        db: Session,
        image_id: str,
        feature_type: FeatureType | None = None,
        status: FeatureStatus | None = None,
    ) -> list[FeatureContract]:
        statement = select(FeatureModel).where(FeatureModel.image_id == image_id)
        if feature_type is not None:
            statement = statement.where(FeatureModel.feature_type == feature_type.value)
        if status is not None:
            statement = statement.where(FeatureModel.status == status.value)

        rows = db.execute(statement).scalars().all()
        return [self.to_contract(row) for row in rows]

    def get(self, db: Session, image_id: str, feature_id: str) -> FeatureContract | None:
        statement = select(FeatureModel).where(
            FeatureModel.image_id == image_id,
            FeatureModel.feature_id == feature_id,
        )
        row = db.execute(statement).scalar_one_or_none()
        return self.to_contract(row) if row else None

    def get_by_id(self, db: Session, feature_id: str) -> FeatureModel | None:
        return db.get(FeatureModel, feature_id)

    def upsert_many(self, db: Session, features: Iterable[FeatureContract]) -> None:
        for feature in features:
            existing = db.get(FeatureModel, feature.feature_id)
            payload = self.to_model_kwargs(feature)
            if existing is None:
                db.add(FeatureModel(**payload))
            else:
                for key, value in payload.items():
                    setattr(existing, key, value)
        db.commit()

    def update_status(self, db: Session, feature_id: str, status: FeatureStatus) -> FeatureModel | None:
        feature = db.get(FeatureModel, feature_id)
        if feature is None:
            return None
        feature.status = status.value
        db.commit()
        db.refresh(feature)
        return feature

    def to_contract(self, row: FeatureModel) -> FeatureContract:
        return FeatureContract(
            feature_id=row.feature_id,
            image_id=row.image_id,
            feature_type=FeatureType(row.feature_type),
            geometry=json.loads(row.geometry_json),
            properties=FeatureProperties(
                area_m2=row.area_m2,
                perimeter_m=row.perimeter_m,
                length_m=row.length_m,
                confidence=row.confidence,
                confidence_level=row.confidence_level,
                status=row.status,
            ),
        )

    def to_model_kwargs(self, feature: FeatureContract) -> dict:
        return {
            "feature_id": feature.feature_id,
            "image_id": feature.image_id,
            "feature_type": feature.feature_type.value,
            "geometry_json": json.dumps(feature.geometry),
            "area_m2": feature.properties.area_m2,
            "perimeter_m": feature.properties.perimeter_m,
            "length_m": feature.properties.length_m,
            "confidence": feature.properties.confidence,
            "confidence_level": feature.properties.confidence_level.value,
            "status": feature.properties.status.value,
        }


feature_repository = FeatureRepository()

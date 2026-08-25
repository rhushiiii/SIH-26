from app.contracts.schemas import (
    ConfidenceLevel,
    FeatureContract,
    FeatureProperties,
    FeatureStatus,
    FeatureType,
)
from app.core.exceptions import APIError
from app.repositories.feature_repository import feature_repository


class FeatureService:
    def list_features(
        self,
        db,
        image_id: str,
        feature_type: FeatureType | None = None,
        status: FeatureStatus | None = None,
    ) -> list[FeatureContract]:
        return feature_repository.list_by_image(db, image_id, feature_type, status)

    def get_feature(self, db, image_id: str, feature_id: str) -> FeatureContract:
        feature = feature_repository.get(db, image_id, feature_id)
        if feature is None:
            raise APIError("FEATURE_NOT_FOUND", "Feature not found", 404)
        return feature

    def ingest_features(self, db, features: list[FeatureContract]) -> None:
        feature_repository.upsert_many(db, features)

    def seed_demo_features(self, db, image_id: str) -> None:
        if feature_repository.list_by_image(db, image_id):
            return

        self.ingest_features(
            db,
            [
                FeatureContract(
                    feature_id=f"building_{image_id[-6:]}_001",
                    image_id=image_id,
                    feature_type=FeatureType.BUILDING,
                    geometry=rectangle(72.8791, 19.1241, 72.8795, 19.1245),
                    properties=FeatureProperties(
                        area_m2=143.72,
                        perimeter_m=49.13,
                        confidence=0.94,
                        confidence_level=ConfidenceLevel.HIGH,
                        status=FeatureStatus.AUTO_ACCEPTED,
                    ),
                ),
                FeatureContract(
                    feature_id=f"road_{image_id[-6:]}_001",
                    image_id=image_id,
                    feature_type=FeatureType.ROAD,
                    geometry=rectangle(72.8788, 19.1238, 72.8801, 19.1240),
                    properties=FeatureProperties(
                        area_m2=1210.5,
                        perimeter_m=None,
                        length_m=480.4,
                        confidence=0.74,
                        confidence_level=ConfidenceLevel.MEDIUM,
                        status=FeatureStatus.REVIEW_RECOMMENDED,
                    ),
                ),
                FeatureContract(
                    feature_id=f"waterbody_{image_id[-6:]}_001",
                    image_id=image_id,
                    feature_type=FeatureType.WATERBODY,
                    geometry=rectangle(72.8802, 19.1246, 72.8808, 19.1251),
                    properties=FeatureProperties(
                        area_m2=5320.4,
                        perimeter_m=312.1,
                        confidence=0.52,
                        confidence_level=ConfidenceLevel.LOW,
                        status=FeatureStatus.HUMAN_REVIEW_REQUIRED,
                    ),
                ),
            ],
        )


def rectangle(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> dict:
    return {
        "type": "Polygon",
        "coordinates": [
            [
                [min_lon, min_lat],
                [max_lon, min_lat],
                [max_lon, max_lat],
                [min_lon, max_lat],
                [min_lon, min_lat],
            ]
        ],
    }


feature_service = FeatureService()

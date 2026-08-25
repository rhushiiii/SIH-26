from app.contracts.schemas import AnalyticsContract, AnalyticsSummary, FeatureStatus, FeatureType
from app.repositories.feature_repository import feature_repository


class AnalyticsService:
    def build_for_image(self, db, image_id: str) -> AnalyticsContract:
        features = feature_repository.list_by_image(db, image_id)

        buildings = [feature for feature in features if feature.feature_type == FeatureType.BUILDING]
        road_area = sum_area(features, FeatureType.ROAD)
        waterbody_area = sum_area(features, FeatureType.WATERBODY)
        building_area = sum(feature.properties.area_m2 for feature in buildings)

        total = len(features)
        high = len([feature for feature in features if feature.properties.confidence_level.value == "HIGH"])
        review_required = len(
            [
                feature
                for feature in features
                if feature.properties.status == FeatureStatus.HUMAN_REVIEW_REQUIRED
            ]
        )

        return AnalyticsContract(
            image_id=image_id,
            summary=AnalyticsSummary(
                building_count=len(buildings),
                building_area_m2=round(building_area, 2),
                road_area_m2=round(road_area, 2),
                waterbody_area_m2=round(waterbody_area, 2),
                average_building_area_m2=round(building_area / len(buildings), 2) if buildings else 0,
                high_confidence_percentage=round((high / total) * 100, 2) if total else 0,
                review_required_percentage=round((review_required / total) * 100, 2) if total else 0,
            ),
        )


def sum_area(features, feature_type: FeatureType) -> float:
    return sum(
        feature.properties.area_m2
        for feature in features
        if feature.feature_type == feature_type
    )


analytics_service = AnalyticsService()

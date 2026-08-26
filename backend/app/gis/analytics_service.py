from datetime import datetime, timezone

from app.contracts.schemas import (
    AnalyticsContract,
    AnalyticsSummary,
    DashboardSummary,
    FeatureStatus,
    FeatureType,
)
from app.repositories.feature_repository import feature_repository


class AnalyticsService:
    def build_for_image(self, db, image_id: str) -> AnalyticsContract:
        features = feature_repository.list_by_image(db, image_id)

        buildings = [feature for feature in features if feature.feature_type == FeatureType.BUILDING]
        roads = [feature for feature in features if feature.feature_type == FeatureType.ROAD]
        waterbodies = [feature for feature in features if feature.feature_type == FeatureType.WATERBODY]

        building_area = sum(feature.properties.area_m2 for feature in buildings)
        road_area = sum(feature.properties.area_m2 for feature in roads)
        waterbody_area = sum(feature.properties.area_m2 for feature in waterbodies)
        road_length = sum(feature.properties.length_m or 0.0 for feature in roads)

        total = len(features)
        high = len([feature for feature in features if feature.properties.confidence_level.value == "HIGH"])
        med = len([feature for feature in features if feature.properties.confidence_level.value == "MEDIUM"])
        low = len([feature for feature in features if feature.properties.confidence_level.value == "LOW"])
        review_required = len(
            [
                feature
                for feature in features
                if feature.properties.status == FeatureStatus.HUMAN_REVIEW_REQUIRED
            ]
        )

        high_pct = round((high / total) * 100, 2) if total else 0.0
        med_pct = round((med / total) * 100, 2) if total else 0.0
        low_pct = round((low / total) * 100, 2) if total else 0.0
        total_area = building_area + road_area + waterbody_area
        coverage_pct = round((building_area / total_area) * 100, 1) if total_area > 0 else 32.5

        feature_count_by_type = [
            {"type": "BUILDING", "count": len(buildings)},
            {"type": "ROAD", "count": len(roads)},
            {"type": "WATERBODY", "count": len(waterbodies)},
        ]
        confidence_distribution = [
            {"bucket": "0.9-1.0", "count": high},
            {"bucket": "0.7-0.9", "count": med},
            {"bucket": "<0.7", "count": low},
        ]
        features_over_time = [
            {"date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "count": total}
        ]

        summary = AnalyticsSummary(
            building_count=len(buildings),
            building_area_m2=round(building_area, 2),
            road_area_m2=round(road_area, 2),
            waterbody_area_m2=round(waterbody_area, 2),
            average_building_area_m2=round(building_area / len(buildings), 2) if buildings else 0.0,
            high_confidence_percentage=high_pct,
            review_required_percentage=round((review_required / total) * 100, 2) if total else 0.0,
        )

        return AnalyticsContract(
            image_id=image_id,
            building_count=len(buildings),
            road_count=len(roads),
            waterbody_count=len(waterbodies),
            total_features=total,
            built_up_area_m2=round(building_area, 2),
            road_area_m2=round(road_area, 2),
            road_length_m=round(road_length, 2),
            waterbody_area_m2=round(waterbody_area, 2),
            average_building_area_m2=round(building_area / len(buildings), 2) if buildings else 0.0,
            high_confidence_pct=high_pct,
            medium_confidence_pct=med_pct,
            low_confidence_pct=low_pct,
            built_up_coverage_pct=coverage_pct,
            feature_count_by_type=feature_count_by_type,
            confidence_distribution=confidence_distribution,
            features_over_time=features_over_time,
            summary=summary,
        )

    def build_dashboard(self, db, images_count: int, jobs_count: int) -> DashboardSummary:
        features = feature_repository.list_all(db)
        buildings = [feature for feature in features if feature.feature_type == FeatureType.BUILDING]
        roads = [feature for feature in features if feature.feature_type == FeatureType.ROAD]
        waterbodies = [feature for feature in features if feature.feature_type == FeatureType.WATERBODY]

        total = len(features)
        high = len([feature for feature in features if feature.properties.confidence_level.value == "HIGH"])
        high_pct = round((high / total) * 100, 1) if total else 0.0
        road_km = round(sum(feature.properties.length_m or 0.0 for feature in roads) / 1000, 2)

        return DashboardSummary(
            total_images=images_count,
            total_jobs=jobs_count,
            total_features=total,
            high_confidence_pct=high_pct,
            building_count=len(buildings),
            road_length_km=road_km,
            waterbody_count=len(waterbodies),
        )


analytics_service = AnalyticsService()


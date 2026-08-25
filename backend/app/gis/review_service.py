from app.contracts.schemas import FeatureStatus, ReviewAction, ReviewContract, ReviewRequest
from app.core.exceptions import APIError
from app.repositories.feature_repository import feature_repository
from app.repositories.review_repository import review_repository


class ReviewService:
    def review_feature(self, db, feature_id: str, request: ReviewRequest) -> ReviewContract:
        feature = feature_repository.get_by_id(db, feature_id)
        if feature is None:
            raise APIError("FEATURE_NOT_FOUND", "Feature not found", 404)

        review = review_repository.create(db, feature_id, request)
        feature_repository.update_status(db, feature_id, status_for_action(request.action))
        return review


def status_for_action(action: ReviewAction) -> FeatureStatus:
    if action == ReviewAction.ACCEPT:
        return FeatureStatus.ACCEPTED
    if action == ReviewAction.REJECT:
        return FeatureStatus.REJECTED
    return FeatureStatus.EDITED


review_service = ReviewService()

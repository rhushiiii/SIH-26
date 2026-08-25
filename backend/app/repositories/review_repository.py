from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.contracts.schemas import ReviewContract, ReviewRequest
from app.db.models import ReviewModel
from app.services.id_factory import id_factory


class ReviewRepository:
    def create(self, db: Session, feature_id: str, request: ReviewRequest) -> ReviewContract:
        review = ReviewModel(
            review_id=id_factory.next_review_id(),
            feature_id=feature_id,
            reviewer_id=request.reviewer_id,
            action=request.action.value,
            comment=request.comment,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        return ReviewContract(
            review_id=review.review_id,
            feature_id=review.feature_id,
            reviewer_id=review.reviewer_id,
            action=review.action,
            comment=review.comment,
            timestamp=review.timestamp,
        )


review_repository = ReviewRepository()

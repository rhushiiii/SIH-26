from fastapi import APIRouter

from app.api.v1 import analytics, exports, features, images, jobs, reviews

router = APIRouter()
router.include_router(images.router)
router.include_router(jobs.router)
router.include_router(features.router)
router.include_router(analytics.router)
router.include_router(reviews.router)
router.include_router(exports.router)

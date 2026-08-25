import asyncio
from datetime import datetime, timezone

from app.contracts.schemas import JobStage, JobStatus
from app.db.session import SessionLocal
from app.gis.feature_service import feature_service
from app.services.job_service import job_service


class JobRunner:
    async def run(self, job_id: str) -> None:
        job = job_service.get_job(job_id)
        job.started_at = datetime.now(timezone.utc)
        job.tiles_total = 144
        job_service.update_job(job)

        steps = [
            (JobStatus.VALIDATING, JobStage.IMAGE_VALIDATION, 10, 0),
            (JobStatus.PREPROCESSING, JobStage.TILE_GENERATION, 25, 24),
            (JobStatus.INFERENCE, JobStage.MODEL_INFERENCE, 67, 96),
            (JobStatus.POSTPROCESSING, JobStage.MASK_STITCHING, 82, 144),
            (JobStatus.POSTPROCESSING, JobStage.POLYGONIZATION, 92, 144),
            (JobStatus.FINALIZING, JobStage.FEATURE_FINALIZATION, 98, 144),
        ]

        for status, stage, progress, tiles_processed in steps:
            job = job_service.get_job(job_id)
            if job.status == JobStatus.CANCELLED:
                return
            job.status = status
            job.stage = stage.value
            job.progress = progress
            job.tiles_processed = tiles_processed
            job_service.update_job(job)
            await asyncio.sleep(0.1)

        job = job_service.get_job(job_id)
        if job.status == JobStatus.CANCELLED:
            return
        job.status = JobStatus.COMPLETED
        job.stage = JobStage.FEATURE_FINALIZATION.value
        job.progress = 100
        job.tiles_processed = job.tiles_total
        job.completed_at = datetime.now(timezone.utc)
        job_service.update_job(job)

        with SessionLocal() as db:
            feature_service.seed_demo_features(db, job.image_id)


job_runner = JobRunner()

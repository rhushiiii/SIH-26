import asyncio
from datetime import datetime, timezone

from app.contracts.schemas import JobStage, JobStatus
from app.db.session import SessionLocal
from app.gis.feature_service import feature_service
from app.services.image_service import image_service
from app.services.job_service import job_service


class JobRunner:
    async def run(self, job_id: str) -> None:
        job = job_service.get_job(job_id)
        job.started_at = datetime.now(timezone.utc)
        job.tiles_total = 144
        job_service.update_job(job)

        steps = [
            (JobStatus.VALIDATING, "VALIDATING", JobStage.IMAGE_VALIDATION, 10, 0),
            (JobStatus.PREPROCESSING, "PREPROCESSING", JobStage.TILE_GENERATION, 25, 24),
            (JobStatus.INFERENCE, "INFERENCE", JobStage.MODEL_INFERENCE, 67, 96),
            (JobStatus.POSTPROCESSING, "POSTPROCESSING", JobStage.MASK_STITCHING, 82, 144),
            (JobStatus.POSTPROCESSING, "POSTPROCESSING", JobStage.POLYGONIZATION, 92, 144),
            (JobStatus.FINALIZING, "FINALIZING", JobStage.FEATURE_FINALIZATION, 98, 144),
        ]

        for status, stage_name, stage_enum, progress, tiles_processed in steps:
            job = job_service.get_job(job_id)
            if job.status == JobStatus.CANCELLED:
                return
            job.status = status
            job.stage = stage_enum.value
            job.progress = progress
            job.tiles_processed = tiles_processed
            # Update detailed stage progress
            stages = []
            stage_order = ["VALIDATING", "PREPROCESSING", "INFERENCE", "POSTPROCESSING", "FINALIZING"]
            for s in stage_order:
                if s == stage_name:
                    stages.append({"name": s, "status": "RUNNING", "progress": progress})
                elif stage_order.index(s) < stage_order.index(stage_name):
                    stages.append({"name": s, "status": "COMPLETED", "progress": 100})
                else:
                    stages.append({"name": s, "status": "PENDING", "progress": 0})
            job.stages = stages
            job_service.update_job(job)
            await asyncio.sleep(0.1)

        job = job_service.get_job(job_id)
        if job.status == JobStatus.CANCELLED:
            return
        job.status = JobStatus.COMPLETED
        job.stage = "COMPLETED"
        job.progress = 100
        job.tiles_processed = job.tiles_total
        job.completed_at = datetime.now(timezone.utc)
        job.stages = [
            {"name": s, "status": "COMPLETED", "progress": 100}
            for s in ["VALIDATING", "PREPROCESSING", "INFERENCE", "POSTPROCESSING", "FINALIZING"]
        ]
        job_service.update_job(job)

        with SessionLocal() as db:
            seeded = feature_service.seed_demo_features(db, job.image_id)
            feature_count = len(seeded) if seeded else 3
            image_service.update_image(job.image_id, status="COMPLETED", feature_count=feature_count)


job_runner = JobRunner()


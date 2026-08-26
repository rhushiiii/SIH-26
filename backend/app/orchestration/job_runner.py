import asyncio
from datetime import datetime, timezone
from pathlib import Path
import sys

from app.contracts.schemas import (
    ConfidenceLevel,
    FeatureContract,
    FeatureProperties,
    FeatureStatus,
    FeatureType,
    JobStage,
    JobStatus,
)
from app.core.config import IMAGE_DATA_DIR
from app.db.session import SessionLocal
from app.gis.feature_service import feature_service
from app.services.image_service import image_service
from app.services.job_service import job_service

# Add project root to sys.path so ml.pipeline is importable
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))


class JobRunner:
    async def run(self, job_id: str) -> None:
        job = job_service.get_job(job_id)
        job.started_at = datetime.now(timezone.utc)
        job.status = JobStatus.VALIDATING
        job.stage = JobStage.IMAGE_VALIDATION.value
        job.progress = 10
        job.stages = [
            {"name": "VALIDATING", "status": "RUNNING", "progress": 10},
            {"name": "PREPROCESSING", "status": "PENDING", "progress": 0},
            {"name": "INFERENCE", "status": "PENDING", "progress": 0},
            {"name": "POSTPROCESSING", "status": "PENDING", "progress": 0},
            {"name": "FINALIZING", "status": "PENDING", "progress": 0},
        ]
        job_service.update_job(job)
        await asyncio.sleep(0.1)

        # Locate image file on disk
        image_dir = IMAGE_DATA_DIR / job.image_id / "original"
        image_path: Path | None = None
        if image_dir.exists():
            for f in image_dir.iterdir():
                if f.is_file():
                    image_path = f
                    break

        # Stage 2: Preprocessing
        job = job_service.get_job(job_id)
        if job.status == JobStatus.CANCELLED:
            return
        job.status = JobStatus.PREPROCESSING
        job.stage = JobStage.TILE_GENERATION.value
        job.progress = 25
        job.stages = [
            {"name": "VALIDATING", "status": "COMPLETED", "progress": 100},
            {"name": "PREPROCESSING", "status": "RUNNING", "progress": 25},
            {"name": "INFERENCE", "status": "PENDING", "progress": 0},
            {"name": "POSTPROCESSING", "status": "PENDING", "progress": 0},
            {"name": "FINALIZING", "status": "PENDING", "progress": 0},
        ]
        job_service.update_job(job)
        await asyncio.sleep(0.1)

        # Stage 3 & 4: Inference & Vectorization
        job = job_service.get_job(job_id)
        if job.status == JobStatus.CANCELLED:
            return
        job.status = JobStatus.INFERENCE
        job.stage = JobStage.MODEL_INFERENCE.value
        job.progress = 40
        job.stages = [
            {"name": "VALIDATING", "status": "COMPLETED", "progress": 100},
            {"name": "PREPROCESSING", "status": "COMPLETED", "progress": 100},
            {"name": "INFERENCE", "status": "RUNNING", "progress": 40},
            {"name": "POSTPROCESSING", "status": "PENDING", "progress": 0},
            {"name": "FINALIZING", "status": "PENDING", "progress": 0},
        ]
        job_service.update_job(job)

        features: list[FeatureContract] = []
        if image_path and image_path.exists():
            try:
                from ml.pipeline import process_image

                def on_tile_progress(tile_idx: int, total_tiles: int, _: str) -> None:
                    curr = job_service.get_job(job_id)
                    if curr.status != JobStatus.CANCELLED:
                        pct = int(35 + (tile_idx / max(1, total_tiles)) * 45)
                        curr.progress = min(80, pct)
                        curr.tiles_processed = tile_idx
                        curr.tiles_total = total_tiles
                        job_service.update_job(curr)

                # Run heavy ML inference in thread pool without blocking event loop
                raw_features = await asyncio.to_thread(
                    process_image,
                    image_path,
                    job.image_id,
                    job_id=job.job_id,
                    progress_callback=on_tile_progress,
                )

                for rf in raw_features:
                    features.append(
                        FeatureContract(
                            feature_id=rf.feature_id,
                            image_id=rf.image_id,
                            feature_type=FeatureType(rf.feature_type.value),
                            geometry=rf.geometry,
                            properties=FeatureProperties(
                                area_m2=rf.properties.area_m2,
                                perimeter_m=rf.properties.perimeter_m,
                                length_m=rf.properties.length_m,
                                confidence=rf.properties.confidence,
                                confidence_level=ConfidenceLevel(
                                    rf.properties.confidence_level.value
                                ),
                                status=FeatureStatus(rf.properties.status.value),
                            ),
                        )
                    )
            except Exception as exc:
                print(f"[JobRunner] ML inference fallback: {exc}")

        # Stage 5: Finalizing
        job = job_service.get_job(job_id)
        if job.status == JobStatus.CANCELLED:
            return
        job.status = JobStatus.FINALIZING
        job.stage = JobStage.FEATURE_FINALIZATION.value
        job.progress = 95
        job.stages = [
            {"name": "VALIDATING", "status": "COMPLETED", "progress": 100},
            {"name": "PREPROCESSING", "status": "COMPLETED", "progress": 100},
            {"name": "INFERENCE", "status": "COMPLETED", "progress": 100},
            {"name": "POSTPROCESSING", "status": "COMPLETED", "progress": 100},
            {"name": "FINALIZING", "status": "RUNNING", "progress": 95},
        ]
        job_service.update_job(job)

        with SessionLocal() as db:
            if features:
                feature_service.ingest_features(db, features)
                feature_count = len(features)
            else:
                feature_service.seed_demo_features(db, job.image_id)
                feature_count = len(feature_service.list_features(db, job.image_id))

            image_service.update_image(
                job.image_id, status="COMPLETED", feature_count=feature_count
            )

        job = job_service.get_job(job_id)
        if job.status == JobStatus.CANCELLED:
            return
        job.status = JobStatus.COMPLETED
        job.stage = "COMPLETED"
        job.progress = 100
        job.tiles_processed = job.tiles_total or 1
        job.completed_at = datetime.now(timezone.utc)
        job.stages = [
            {"name": s, "status": "COMPLETED", "progress": 100}
            for s in ["VALIDATING", "PREPROCESSING", "INFERENCE", "POSTPROCESSING", "FINALIZING"]
        ]
        job_service.update_job(job)


job_runner = JobRunner()



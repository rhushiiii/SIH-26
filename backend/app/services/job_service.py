from datetime import datetime, timezone

from app.contracts.schemas import CreateJobRequest, JobContract, JobStatus
from app.core.exceptions import APIError
from app.services.id_factory import id_factory
from app.services.image_service import image_service


class JobService:
    def __init__(self) -> None:
        self._jobs: dict[str, JobContract] = {}

    def list_jobs(self) -> list[JobContract]:
        return list(self._jobs.values())

    def create_job(self, request: CreateJobRequest) -> JobContract:
        if not image_service.exists(request.image_id):
            raise APIError("IMAGE_NOT_FOUND", "Image not found", 404)

        for job in self._jobs.values():
            if job.image_id == request.image_id and job.status not in {
                JobStatus.COMPLETED,
                JobStatus.FAILED,
                JobStatus.CANCELLED,
            }:
                raise APIError("JOB_ALREADY_RUNNING", "A processing job is already running for this image", 409)

        image = image_service.get_image(request.image_id)
        now = datetime.now(timezone.utc)

        job = JobContract(
            job_id=id_factory.next_job_id(),
            image_id=request.image_id,
            filename=image.filename,
            status=JobStatus.QUEUED,
            stage="QUEUED",
            progress=0,
            stages=[
                {"name": "VALIDATING", "status": "PENDING", "progress": 0},
                {"name": "PREPROCESSING", "status": "PENDING", "progress": 0},
                {"name": "INFERENCE", "status": "PENDING", "progress": 0},
                {"name": "POSTPROCESSING", "status": "PENDING", "progress": 0},
                {"name": "FINALIZING", "status": "PENDING", "progress": 0},
            ],
            tiles_total=0,
            tiles_processed=0,
            created_at=now,
            updated_at=now,
            retry_supported=True,
        )
        self._jobs[job.job_id] = job
        image_service.update_image(request.image_id, status="PROCESSING", job_id=job.job_id)
        return job

    def get_job(self, job_id: str) -> JobContract:
        job = self._jobs.get(job_id)
        if job is None:
            raise APIError("JOB_NOT_FOUND", "Job not found", 404)
        return job

    def update_job(self, job: JobContract) -> None:
        job.updated_at = datetime.now(timezone.utc)
        self._jobs[job.job_id] = job

    def cancel_job(self, job_id: str) -> JobContract:
        job = self.get_job(job_id)
        if job.status in {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED}:
            return job

        job.status = JobStatus.CANCELLED
        job.stage = "CANCELLED"
        job.completed_at = datetime.now(timezone.utc)
        self.update_job(job)
        image_service.update_image(job.image_id, status="UPLOADED")
        return job

    def retry_job(self, job_id: str) -> JobContract:
        job = self.get_job(job_id)
        now = datetime.now(timezone.utc)
        job.status = JobStatus.QUEUED
        job.stage = "QUEUED"
        job.progress = 0
        job.tiles_processed = 0
        job.error = None
        job.started_at = now
        job.completed_at = None
        job.updated_at = now
        job.stages = [
            {"name": "VALIDATING", "status": "PENDING", "progress": 0},
            {"name": "PREPROCESSING", "status": "PENDING", "progress": 0},
            {"name": "INFERENCE", "status": "PENDING", "progress": 0},
            {"name": "POSTPROCESSING", "status": "PENDING", "progress": 0},
            {"name": "FINALIZING", "status": "PENDING", "progress": 0},
        ]
        self.update_job(job)
        image_service.update_image(job.image_id, status="PROCESSING", job_id=job.job_id)
        return job



job_service = JobService()

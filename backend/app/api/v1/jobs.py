from fastapi import APIRouter, BackgroundTasks

from app.contracts.envelope import ok
from app.contracts.schemas import CreateJobRequest
from app.orchestration.job_runner import job_runner
from app.services.job_service import job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("")
async def create_job(request: CreateJobRequest, background_tasks: BackgroundTasks):
    job = job_service.create_job(request)
    background_tasks.add_task(job_runner.run, job.job_id)
    return ok(job.model_dump(mode="json"))


@router.get("")
def list_jobs():
    jobs = job_service.list_jobs()
    return ok(
        {
            "items": [job.model_dump(mode="json") for job in jobs],
            "total": len(jobs),
            "page": 1,
            "page_size": len(jobs) or 20,
        },
        meta={"total": len(jobs)},
    )


@router.get("/{job_id}")
def get_job(job_id: str):
    job = job_service.get_job(job_id)
    return ok(job.model_dump(mode="json"))


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str):
    job = job_service.cancel_job(job_id)
    return ok(job.model_dump(mode="json"))


@router.post("/{job_id}/retry")
def retry_job(job_id: str, background_tasks: BackgroundTasks):
    job = job_service.retry_job(job_id)
    background_tasks.add_task(job_runner.run, job.job_id)
    return ok(job.model_dump(mode="json"))


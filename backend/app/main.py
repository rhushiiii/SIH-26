from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.api.v1.router import router as api_v1_router
from app.contracts.envelope import fail
from app.core.config import API_PREFIX, EXPORT_DATA_DIR, IMAGE_DATA_DIR
from app.core.exceptions import APIError, api_error_handler
from app.db.session import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    IMAGE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DATA_DIR.mkdir(parents=True, exist_ok=True)
    init_db()
    yield


app = FastAPI(
    title="Drishti GeoAI Backend",
    version="0.1.0",
    description="P2 FastAPI backend for image management and job orchestration.",
    lifespan=lifespan,
)

app.add_exception_handler(APIError, api_error_handler)
app.include_router(api_v1_router, prefix=API_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.exception_handler(404)
async def not_found_handler(_, __):
    return JSONResponse(
        status_code=404,
        content=fail("NOT_FOUND", "Endpoint not found"),
    )

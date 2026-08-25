from fastapi import APIRouter, UploadFile

from app.contracts.envelope import ok
from app.services.image_service import image_service

router = APIRouter(prefix="/images", tags=["images"])


@router.post("")
async def upload_image(file: UploadFile):
    result = await image_service.save_upload(file)
    return ok(result.model_dump())


@router.get("/{image_id}")
def get_image(image_id: str):
    image = image_service.get_image(image_id)
    return ok(image.model_dump())

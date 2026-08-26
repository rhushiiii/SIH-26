from fastapi import APIRouter, UploadFile

from app.contracts.envelope import ok
from app.services.image_service import image_service

router = APIRouter(prefix="/images", tags=["images"])


@router.post("")
async def upload_image(file: UploadFile):
    result = await image_service.save_upload(file)
    return ok(result.model_dump())


@router.get("")
def list_images():
    images = image_service.list_images()
    return ok(
        {
            "items": [image.model_dump(mode="json") for image in images],
            "total": len(images),
            "page": 1,
            "page_size": len(images) or 20,
        },
        meta={"total": len(images)},
    )


@router.get("/{image_id}")
def get_image(image_id: str):
    image = image_service.get_image(image_id)
    return ok(image.model_dump(mode="json"))


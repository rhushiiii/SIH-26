import shutil
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.contracts.schemas import ImageContract, UploadImageResponse
from app.core.config import IMAGE_DATA_DIR, MAX_UPLOAD_BYTES, SUPPORTED_EXTENSIONS
from app.core.exceptions import APIError
from app.services.id_factory import id_factory


class ImageService:
    def __init__(self) -> None:
        self._images: dict[str, ImageContract] = {}

    async def save_upload(self, upload: UploadFile) -> UploadImageResponse:
        filename = Path(upload.filename or "").name
        extension = Path(filename).suffix.lower()
        image_format = SUPPORTED_EXTENSIONS.get(extension)

        if not filename or image_format is None:
            raise APIError("INVALID_IMAGE", "Unsupported raster format", 400)

        image_id = id_factory.next_image_id()
        image_dir = IMAGE_DATA_DIR / image_id / "original"
        image_dir.mkdir(parents=True, exist_ok=True)
        image_path = image_dir / filename

        size = 0
        with image_path.open("wb") as out_file:
            while chunk := await upload.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    image_path.unlink(missing_ok=True)
                    raise APIError("INVALID_IMAGE", "Uploaded image exceeds size limit", 413)
                out_file.write(chunk)

        try:
            contract = self._build_contract(image_id, image_path, filename, image_format, size)
        except APIError:
            shutil.rmtree(image_dir.parent, ignore_errors=True)
            raise

        self._images[image_id] = contract
        return UploadImageResponse(image_id=image_id)

    def get_image(self, image_id: str) -> ImageContract:
        image = self._images.get(image_id)
        if image is None:
            raise APIError("IMAGE_NOT_FOUND", "Image not found", 404)
        return image

    def exists(self, image_id: str) -> bool:
        return image_id in self._images

    def _build_contract(
        self,
        image_id: str,
        image_path: Path,
        filename: str,
        image_format: str,
        file_size_bytes: int,
    ) -> ImageContract:
        try:
            with Image.open(image_path) as image:
                width, height = image.size
                bands = len(image.getbands())
                dtype = str(image.mode)
        except (UnidentifiedImageError, OSError) as exc:
            raise APIError("INVALID_IMAGE", "Unreadable or corrupt image file", 400) from exc

        return ImageContract(
            image_id=image_id,
            filename=filename,
            format=image_format,
            width=width,
            height=height,
            bands=bands,
            dtype=dtype,
            crs=None,
            resolution_x_m=None,
            resolution_y_m=None,
            file_size_bytes=file_size_bytes,
        )


image_service = ImageService()

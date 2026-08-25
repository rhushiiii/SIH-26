from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
IMAGE_DATA_DIR = DATA_DIR / "images"
EXPORT_DATA_DIR = DATA_DIR / "exports"

API_PREFIX = "/api/v1"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'drishti.db'}")

SUPPORTED_EXTENSIONS = {
    ".tif": "GeoTIFF",
    ".tiff": "GeoTIFF",
    ".png": "PNG",
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
}

MAX_UPLOAD_BYTES = 750 * 1024 * 1024

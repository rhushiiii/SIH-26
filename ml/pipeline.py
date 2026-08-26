"""
Unified DRISHTI ML/CV/GIS Inference Pipeline.

Takes an orthophoto (GeoTIFF, PNG, JPEG) and generates standard GeoJSON FeatureContracts
using PyTorch UNet++ models, sliding-window tiling, and geodetic vectorization.
"""

import os
import sys
from pathlib import Path
from typing import List, Optional, Callable
import numpy as np
from PIL import Image

try:
    import rasterio
    from rasterio.windows import Window
    from rasterio.transform import Affine
except ImportError:
    rasterio = None

# Ensure ml directory is on sys.path
ML_ROOT = Path(__file__).resolve().parent
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from contracts.tile_contract import TileContract
from contracts.feature_contract import FeatureContract
from cv.inference.engine import RealSegmentationEngine
from preprocessing.polygonization.vectorizer import FeatureVectorizer

# Reusable singleton engine instance
_ENGINE_INSTANCE: Optional[RealSegmentationEngine] = None


def get_engine() -> RealSegmentationEngine:
    global _ENGINE_INSTANCE
    if _ENGINE_INSTANCE is None:
        _ENGINE_INSTANCE = RealSegmentationEngine()
    return _ENGINE_INSTANCE


def process_image(
    image_path: Path | str,
    image_id: str,
    job_id: str = "job_auto",
    tile_size: int = 512,
    overlap: int = 64,
    progress_callback: Optional[Callable[[int, int, str], None]] = None,
) -> List[FeatureContract]:
    """
    Processes a complete raster image end-to-end:
    - Slices large rasters into 512x512 overlapping tiles
    - Runs multi-class segmentation models
    - Polygonizes predicted masks with real-world CRS projection
    - Returns a list of standard FeatureContract objects ready for backend ingestion.
    """
    image_path = Path(image_path)
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found at: {image_path}")

    engine = get_engine()
    vectorizer = FeatureVectorizer(resolution_m=0.5)
    all_features: List[FeatureContract] = []

    is_geotiff = image_path.suffix.lower() in [".tif", ".tiff", ".geotiff"]

    if is_geotiff and rasterio is not None:
        with rasterio.open(image_path) as src:
            width = src.width
            height = src.height
            crs_epsg = str(src.crs) if src.crs else "EPSG:3857"
            transform = src.transform

            step = tile_size - overlap
            x_offsets = list(range(0, width, step))
            y_offsets = list(range(0, height, step))
            total_tiles = len(x_offsets) * len(y_offsets)

            tile_idx = 0
            for y_off in y_offsets:
                for x_off in x_offsets:
                    tile_idx += 1
                    w = min(tile_size, width - x_off)
                    h = min(tile_size, height - y_off)

                    window = Window(x_off, y_off, w, h)
                    num_bands = min(3, src.count)
                    tile_data = src.read(list(range(1, num_bands + 1)), window=window)

                    if tile_data.ndim == 3:
                        tile_data = np.transpose(tile_data, (1, 2, 0))
                        if tile_data.shape[2] == 1:
                            tile_data = np.repeat(tile_data, 3, axis=-1)

                    if w < tile_size or h < tile_size:
                        padded = np.zeros((tile_size, tile_size, 3), dtype=tile_data.dtype)
                        padded[:h, :w, :] = tile_data
                        tile_data = padded

                    tile_transform = rasterio.windows.transform(window, transform)
                    tile_contract = TileContract(
                        tile_id=f"tile_{image_id}_{tile_idx}",
                        image_id=image_id,
                        job_id=job_id,
                        x_offset=x_off,
                        y_offset=y_off,
                        width=w,
                        height=h,
                    )

                    if progress_callback:
                        progress_callback(tile_idx, total_tiles, "INFERENCE")

                    seg_result = engine.predict(tile_contract, tile_data)
                    tile_features = vectorizer.polygonize(
                        seg_result,
                        affine_transform=tile_transform,
                        crs_epsg=crs_epsg,
                    )
                    all_features.extend(tile_features)
    else:
        pil_img = Image.open(image_path).convert("RGB")
        width, height = pil_img.size

        step = tile_size - overlap
        x_offsets = list(range(0, max(1, width), step)) if width > tile_size else [0]
        y_offsets = list(range(0, max(1, height), step)) if height > tile_size else [0]
        total_tiles = len(x_offsets) * len(y_offsets)

        tile_idx = 0
        for y_off in y_offsets:
            for x_off in x_offsets:
                tile_idx += 1
                w = min(tile_size, width - x_off)
                h = min(tile_size, height - y_off)

                crop = pil_img.crop((x_off, y_off, x_off + w, y_off + h))
                if crop.size != (tile_size, tile_size):
                    crop = crop.resize((tile_size, tile_size))
                tile_data = np.array(crop, dtype=np.uint8)

                tile_contract = TileContract(
                    tile_id=f"tile_{image_id}_{tile_idx}",
                    image_id=image_id,
                    job_id=job_id,
                    x_offset=x_off,
                    y_offset=y_off,
                    width=w,
                    height=h,
                )

                if progress_callback:
                    progress_callback(tile_idx, total_tiles, "INFERENCE")

                seg_result = engine.predict(tile_contract, tile_data)
                tile_features = vectorizer.polygonize(
                    seg_result,
                    affine_transform=None,
                    crs_epsg=None,
                )
                all_features.extend(tile_features)

    return all_features


if __name__ == "__main__":
    sample = ML_ROOT / "sample_data" / "test1.png"
    print(f"Testing pipeline on: {sample}")
    features = process_image(sample, image_id="test_img_001")
    print(f"[SUCCESS] Extracted {len(features)} vector features!")
    if features:
        sample_f = features[0]
        print("Sample feature:")
        print(f"  ID: {sample_f.feature_id}")
        print(f"  Type: {sample_f.feature_type.value}")
        print(f"  Area: {sample_f.area_m2} m^2")
        print(f"  Confidence: {sample_f.confidence} ({sample_f.confidence_level.value})")
        print(f"  Geometry: {sample_f.geometry['type']} with {len(sample_f.geometry['coordinates'][0])} coordinates")

import os
import subprocess
# pyrefly: ignore [missing-import]
import rasterio
from typing import Dict, Any
from contracts.image_contract import ImageContract


class RasterLoader:
    """
    Loads and extracts metadata from GeoTIFF / TIFF / ECW files.
    Uses rasterio for all reading.  ECW → GeoTIFF conversion uses gdal_translate.
    """

    def __init__(self, ecw_support: bool = True):
        self.ecw_support = ecw_support

    def prepare_raster(self, image_path: str, output_dir: str = "/tmp") -> str:
        """
        Returns a path to a readable GeoTIFF.
        If input is ECW and GDAL ECW support is available, converts it first.
        """
        ext = os.path.splitext(image_path)[1].lower()
        if ext == ".ecw":
            if not self.ecw_support:
                raise ValueError("ECW input provided but ECW support is disabled.")
            os.makedirs(output_dir, exist_ok=True)
            basename = os.path.splitext(os.path.basename(image_path))[0]
            out_path = os.path.join(output_dir, basename + ".tif")
            if not os.path.exists(out_path):
                subprocess.run(
                    ["gdal_translate", "-of", "GTiff", "-co", "COMPRESS=LZW",
                     image_path, out_path],
                    check=True,
                )
            return out_path
        return image_path

    def extract_metadata(self, image_path: str, image_id: str) -> ImageContract:
        """Returns an ImageContract from the raster metadata."""
        with rasterio.open(image_path) as src:
            crs = src.crs.to_string() if src.crs else None
            return ImageContract(
                image_id=image_id,
                filename=os.path.basename(image_path),
                format=src.driver,
                width=src.width,
                height=src.height,
                bands=src.count,
                dtype=str(src.dtypes[0]),
                crs=crs,
                resolution_x_m=src.res[0],
                resolution_y_m=src.res[1],
                file_size_bytes=os.path.getsize(image_path),
            )

    def get_raster_info(self, image_path: str) -> Dict[str, Any]:
        """
        Returns raw raster properties needed by the tiler and vectorizer.
        Includes the rasterio CRS object and Affine transform (not serialised).
        """
        with rasterio.open(image_path) as src:
            return {
                "width": src.width,
                "height": src.height,
                "bands": src.count,
                "dtype": src.dtypes[0],
                "crs": src.crs,
                "transform": src.transform,
                "resolution": src.res,
                "nodata": src.nodata,
                "bounds": src.bounds,
                "meta": src.meta,
            }

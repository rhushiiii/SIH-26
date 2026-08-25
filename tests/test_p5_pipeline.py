import pytest
import numpy as np
# pyrefly: ignore [missing-import]
import rasterio
# pyrefly: ignore [missing-import]
from rasterio.transform import from_origin
import os
import shutil
from typing import Tuple, Any

from contracts.segmentation_contract import SegmentationContract
# pyrefly: ignore [missing-import]
from preprocessing.pipeline import run_p5_pipeline
from contracts import FeatureType

@pytest.fixture
def mock_geotiff(tmp_path):
    """Creates a temporary GeoTIFF for testing."""
    file_path = tmp_path / "test_raster.tif"
    
    # Create a 1024x1024 3-band raster
    data = np.random.randint(0, 255, (3, 1024, 1024), dtype=np.uint8)
    
    # Define transform and CRS (UTM Zone 43N for India)
    transform = from_origin(700000.0, 2100000.0, 0.5, 0.5)
    
    with rasterio.open(
        file_path, 'w', driver='GTiff',
        height=1024, width=1024, count=3, dtype=str(data.dtype),
        crs='+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs',
        transform=transform, nodata=0
    ) as dst:
        dst.write(data)
        
    return str(file_path)

def mock_inference(input_data: Tuple[Any, np.ndarray]) -> SegmentationContract:
    contract, tile_array = input_data
    
    # Create mock probabilities [4, H, W]
    # Background, Building, Road, Waterbody
    h, w = contract.height, contract.width
    probs = np.zeros((4, h, w), dtype=np.float32)
    
    # Set background to 0.1
    probs[0] = 0.1
    
    # Create a small building in the center of the tile
    if contract.x_offset == 0 and contract.y_offset == 0:
        probs[1, 100:200, 100:200] = 0.95
        
    # Create a road across the tile
    probs[2, 300:350, :] = 0.85
    
    seg = SegmentationContract(
        tile_id=contract.tile_id,
        image_id=contract.image_id,
        job_id=contract.job_id,
        model_id="mock_v1",
        model_version="1.0",
        classes=[],
        probabilities=probs
    )
    return seg

def test_p5_pipeline_end_to_end(mock_geotiff):
    image_id = "img_test"
    job_id = "job_test"
    
    features = run_p5_pipeline(
        image_path=mock_geotiff,
        image_id=image_id,
        job_id=job_id,
        mock_inference_fn=mock_inference
    )
    
    assert len(features) > 0
    
    buildings = [f for f in features if f.feature_type == FeatureType.BUILDING]
    roads = [f for f in features if f.feature_type == FeatureType.ROAD]
    
    assert len(buildings) > 0
    assert len(roads) > 0
    
    # Check if building area is somewhat reasonable (100x100 pixels * 0.5*0.5 m/px = 2500m2)
    # The actual extracted area might vary slightly due to blending/thresholding
    b = buildings[0]
    assert b.area_m2 > 1000
    assert b.confidence > 0.8
    assert b.geometry["type"] == "Polygon"

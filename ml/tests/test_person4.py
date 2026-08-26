import pytest
import numpy as np

from contracts.tile_contract import TileContract
from contracts.segmentation_contract import SegmentationContract
from cv.configs.model_config import ModelConfig
from cv.inference.base import InferenceEngine
from cv.inference.mock import MockInferenceEngine
from cv.inference.engine import RealSegmentationEngine
from cv.models.roof_classifier import RoofClassifier


@pytest.fixture
def sample_tile_contract():
    return TileContract(
        tile_id="tile_0_0",
        image_id="img_1001",
        job_id="job_2002",
        x_offset=0,
        y_offset=0,
        width=512,
        height=512,
        overlap=64,
        sequence=0,
    )


@pytest.fixture
def sample_tile_data():
    # Synthetic RGB tile uint8 array [512, 512, 3]
    return np.random.randint(0, 256, size=(512, 512, 3), dtype=np.uint8)


def test_mock_engine_basic(sample_tile_contract, sample_tile_data):
    engine = MockInferenceEngine()
    result = engine.predict(sample_tile_contract, sample_tile_data)

    assert isinstance(result, SegmentationContract)
    assert result.tile_id == "tile_0_0"
    assert result.image_id == "img_1001"
    assert result.job_id == "job_2002"
    assert result.model_id.startswith("mock_")
    assert result.model_version == "1.0.0"

    # Probabilities assertions
    probs = result.probabilities
    assert isinstance(probs, np.ndarray)
    assert probs.dtype == np.float32
    assert probs.shape == (4, 512, 512)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)

    # Predicted mask assertions
    mask = result.predicted_mask
    assert isinstance(mask, np.ndarray)
    assert mask.dtype == np.uint8
    assert mask.shape == (512, 512)
    unique_vals = set(np.unique(mask))
    assert unique_vals.issubset({0, 1, 2, 3})


def test_real_engine_checkpoint_loading(sample_tile_contract, sample_tile_data):
    # Tests that RealSegmentationEngine loads model checkpoints and runs predict
    config = ModelConfig()
    engine = RealSegmentationEngine(config=config)

    result = engine.predict(sample_tile_contract, sample_tile_data)

    assert isinstance(result, SegmentationContract)
    assert result.tile_id == sample_tile_contract.tile_id
    assert result.image_id == sample_tile_contract.image_id
    assert result.job_id == sample_tile_contract.job_id
    assert result.model_id == config.model.model_id
    assert result.model_version == config.model.version

    # Probabilities assertions
    probs = result.probabilities
    assert isinstance(probs, np.ndarray)
    assert probs.dtype == np.float32
    assert probs.shape == (4, 512, 512)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)

    # Predicted mask assertions
    mask = result.predicted_mask
    assert isinstance(mask, np.ndarray)
    assert mask.dtype == np.uint8
    assert mask.shape == (512, 512)
    unique_vals = set(np.unique(mask))
    assert unique_vals.issubset({0, 1, 2, 3})


def test_input_shape_flexibility(sample_tile_contract):
    engine = MockInferenceEngine()

    # Test [C, H, W] tensor shape
    chw_data = np.zeros((3, 256, 256), dtype=np.float32)
    res1 = engine.predict(sample_tile_contract, chw_data)
    assert res1.probabilities.shape == (4, 256, 256)
    assert res1.predicted_mask.shape == (256, 256)

    # Test [H, W, C] tensor shape
    hwc_data = np.zeros((256, 256, 3), dtype=np.uint8)
    res2 = engine.predict(sample_tile_contract, hwc_data)
    assert res2.probabilities.shape == (4, 256, 256)
    assert res2.predicted_mask.shape == (256, 256)


def test_class_mapping_preservation(sample_tile_contract, sample_tile_data):
    engine = MockInferenceEngine()
    res = engine.predict(sample_tile_contract, sample_tile_data)

    assert len(res.classes) == 4
    class_names = [c.class_name for c in res.classes]
    assert class_names == ["BACKGROUND", "BUILDING", "ROAD", "WATERBODY"]
    class_ids = [c.class_id for c in res.classes]
    assert class_ids == [0, 1, 2, 3]


def test_roof_classifier_standalone():
    classifier = RoofClassifier()
    dummy_crop = np.random.randint(0, 256, size=(64, 64, 3), dtype=np.uint8)
    res = classifier.predict(dummy_crop)

    assert "roof_type" in res
    assert "confidence" in res
    assert "probabilities" in res
    assert isinstance(res["confidence"], float)


def test_p4_to_p5_integration_fixture(sample_tile_contract, sample_tile_data):
    """
    REQUIRED INTEGRATION TEST:
    Passes TileContract + tile data into InferenceEngine and verifies output
    can be passed directly to P5 stitching pipeline function signature.
    """
    engine: InferenceEngine = RealSegmentationEngine()

    # P5 calls predict on P4 engine interface
    seg_contract = engine.predict(sample_tile_contract, sample_tile_data)

    # Verify P5 boundary expectations
    assert hasattr(seg_contract, "tile_id")
    assert hasattr(seg_contract, "image_id")
    assert hasattr(seg_contract, "job_id")
    assert hasattr(seg_contract, "probabilities")
    assert hasattr(seg_contract, "predicted_mask")

    assert seg_contract.probabilities.dtype == np.float32
    assert seg_contract.probabilities.shape[0] == 4
    assert seg_contract.predicted_mask.dtype == np.uint8

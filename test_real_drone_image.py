"""
End-to-End P4 & P5 Integration Test on a Real Aerial Drone Photograph.

Loads image, converts to TileContract + numpy data,
runs PyTorch UNet++ segmentation model inference via RealSegmentationEngine,
verifies SegmentationContract return, and renders a clean 3-panel visual output PNG.
"""

import os
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

from contracts.tile_contract import TileContract
from cv.inference.engine import RealSegmentationEngine


def create_color_mask(predicted_mask: np.ndarray) -> np.ndarray:
    """
    Converts uint8 predicted mask {0, 1, 2, 3} into an RGB color image.
    0 = BACKGROUND (Dark Gray: [40, 40, 40])
    1 = BUILDING   (Red: [230, 50, 50])
    2 = ROAD       (Yellow: [240, 200, 40])
    3 = WATERBODY  (Blue: [40, 120, 240])
    """
    h, w = predicted_mask.shape
    color_mask = np.zeros((h, w, 3), dtype=np.uint8)

    color_mask[predicted_mask == 0] = [40, 40, 40]    # Background
    color_mask[predicted_mask == 1] = [230, 50, 50]   # Building (Red)
    color_mask[predicted_mask == 2] = [240, 200, 40]  # Road (Yellow)
    color_mask[predicted_mask == 3] = [40, 120, 240]  # Waterbody (Blue)

    return color_mask


def test_real_drone_image():
    print("=" * 65)
    print("  P4 & P5 INTEGRATION TEST ON REAL AERIAL DRONE IMAGE")
    print("=" * 65)

    img_path = os.path.join("sample_data", "test1.png")
    if not os.path.exists(img_path):
        img_path = os.path.join("sample_data", "test.jpeg")

    print(f"\n[STEP 1: Loading Real Aerial Drone Image: {img_path}]")

    pil_img = Image.open(img_path).convert("RGB")
    pil_crop = pil_img.resize((512, 512))  # Resize to 512x512 tile
    rgb_tile = np.array(pil_crop, dtype=np.uint8)

    print(f"  [OK] Image loaded cleanly. Shape: {rgb_tile.shape} (RGB uint8)")

    # P5 creates TileContract
    tile_contract = TileContract(
        tile_id="tile_real_drone_001",
        image_id="real_drone_orthophoto",
        job_id="job_drone_test",
        x_offset=0,
        y_offset=0,
        width=512,
        height=512,
    )

    print("\n[STEP 2: Handoff P5 TileContract + Tile Data to P4 InferenceEngine]")
    engine = RealSegmentationEngine()

    # P4 INFERENCE CALL
    seg_contract = engine.predict(tile_contract, rgb_tile)

    print("  [OK] P4 inference completed and returned SegmentationContract!")
    print(f"  - Preserved Metadata : tile_id='{seg_contract.tile_id}', job_id='{seg_contract.job_id}'")
    print(f"  - AI Model Info     : model_id='{seg_contract.model_id}', version='{seg_contract.model_version}'")
    print(f"  - Probabilities Map : shape {seg_contract.probabilities.shape} (float32)")
    print(f"  - Predicted Mask    : shape {seg_contract.predicted_mask.shape} (uint8)")

    unique_classes, counts = np.unique(seg_contract.predicted_mask, return_counts=True)
    class_names = {0: "BACKGROUND", 1: "BUILDING", 2: "ROAD", 3: "WATERBODY"}
    print("\n  P5 Classification Breakdown on Drone Image:")
    for cid, cnt in zip(unique_classes, counts):
        pct = (cnt / (512 * 512)) * 100
        print(f"      * {class_names.get(cid, 'UNKNOWN'):<10}: {cnt:>6} pixels ({pct:.2f}%)")

    # STEP 3: Render Clean 3-Panel Visual Comparison plot (No Heatmaps)
    print("\n[STEP 3: Rendering Clean 3-Panel Visual Output Plot]")
    color_mask = create_color_mask(seg_contract.predicted_mask)
    overlay = (0.5 * rgb_tile + 0.5 * color_mask).astype(np.uint8)

    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle("Drishti GeoAI -- AI Feature Segmentation Output", fontsize=16, fontweight='bold')

    # Panel 1: Input Real Drone Image
    axes[0].imshow(rgb_tile)
    axes[0].set_title("1. Original Drone Photo (Input)", fontsize=13, fontweight='bold')
    axes[0].axis("off")

    # Panel 2: Predicted Mask
    axes[1].imshow(color_mask)
    axes[1].set_title("2. AI Predicted Mask\n(Red=Building, Yellow=Road, Blue=Water)", fontsize=13, fontweight='bold')
    axes[1].axis("off")

    # Panel 3: Overlay
    axes[2].imshow(overlay)
    axes[2].set_title("3. Mask Overlay on Drone Photo", fontsize=13, fontweight='bold')
    axes[2].axis("off")

    plt.tight_layout()
    output_png = "real_drone_p4_p5_output.png"
    plt.savefig(output_png, dpi=150, bbox_inches='tight')
    plt.close()

    print(f"  [SUCCESS] Clean 3-panel visual output saved to: {os.path.abspath(output_png)}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    test_real_drone_image()

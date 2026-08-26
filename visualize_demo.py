"""
Visualizer Script for P4 CV/ML AI Segmentation.
Generates clean side-by-side 3-panel PNG images showing:
1. Original Input Drone Image Tile
2. AI Predicted Class Mask (Color-Coded)
3. AI Mask Overlay on Original Image
"""

import os
import matplotlib
matplotlib.use('Agg')  # Headless backend for background execution
import matplotlib.pyplot as plt
import numpy as np
import rasterio

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


def generate_visualizations():
    print("=" * 60)
    print("   DRISHTI GeoAI -- P4 AI SEGMENTATION VISUALIZER")
    print("=" * 60)

    sample_tif = os.path.join("sample_data", "test1.png")
    if not os.path.exists(sample_tif):
        sample_tif = os.path.join("sample_data", "sample_drone_ortho.tif")

    # 1. Load 512x512 tile crop
    print("\n[1/3] Loading input drone image tile...")
    if sample_tif.endswith(".tif"):
        with rasterio.open(sample_tif) as src:
            win = rasterio.windows.Window(256, 256, 512, 512)
            raw_tile = src.read([1, 2, 3], window=win)  # [3, 512, 512]
            rgb_tile = np.transpose(raw_tile, (1, 2, 0))  # [512, 512, 3]
    else:
        from PIL import Image
        img = Image.open(sample_tif).convert("RGB").resize((512, 512))
        rgb_tile = np.array(img, dtype=np.uint8)

    tile_contract = TileContract(
        tile_id="tile_vis_001",
        image_id="sample_drone_ortho",
        job_id="job_vis",
        x_offset=256,
        y_offset=256,
        width=512,
        height=512,
    )

    # 2. Run P4 Real AI Segmentation Engine
    print("[2/3] Running P4 UNet++ Deep Learning Engine...")
    engine = RealSegmentationEngine()
    result = engine.predict(tile_contract, rgb_tile)

    predicted_mask = result.predicted_mask

    color_mask = create_color_mask(predicted_mask)
    overlay = (0.5 * rgb_tile + 0.5 * color_mask).astype(np.uint8)

    # 3. Render and save clean 3-panel side-by-side visualization plot
    print("[3/3] Generating clean 3-panel visual output plot...")

    output_plot_path = "p4_segmentation_visualization.png"

    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle("Drishti GeoAI -- P4 AI Feature Segmentation", fontsize=16, fontweight='bold')

    # Panel 1: Original RGB Image
    axes[0].imshow(rgb_tile)
    axes[0].set_title("1. Original Drone Image (Input)", fontsize=13, fontweight='bold')
    axes[0].axis("off")

    # Panel 2: AI Predicted Mask (Color-Coded)
    axes[1].imshow(color_mask)
    axes[1].set_title("2. AI Segmentation Mask\n(Red=Building, Yellow=Road, Blue=Water)", fontsize=13, fontweight='bold')
    axes[1].axis("off")

    # Panel 3: Overlay on Original Image
    axes[2].imshow(overlay)
    axes[2].set_title("3. AI Mask Overlay on Drone Image", fontsize=13, fontweight='bold')
    axes[2].axis("off")

    plt.tight_layout()
    plt.savefig(output_plot_path, dpi=150, bbox_inches='tight')
    plt.close()

    print(f"\n  [SUCCESS] Visual output saved to: {os.path.abspath(output_plot_path)}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    generate_visualizations()

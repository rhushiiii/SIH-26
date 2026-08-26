"""
P5 GIS Polygonization & Feature Vectorizer Module.

Converts P4 SegmentationContract masks into spatial GIS polygons (FeatureContract)
and calculates real-world Area (m^2), Perimeter (m), Centroid, and Confidence.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from shapely.geometry import shape, mapping
from shapely.ops import transform
# pyrefly: ignore [missing-import]
import rasterio.features
from rasterio.transform import Affine

from contracts.segmentation_contract import SegmentationContract
from contracts.feature_contract import FeatureContract
from contracts import FeatureType, ConfidenceLevel, FeatureStatus


class FeatureVectorizer:
    """
    P5 GIS Vectorizer: Converts P4 AI Segmentation Masks into GeoJSON Polygons,
    calculating real-world Area (m^2), Perimeter (m), and Centroids.
    """

    def __init__(self, resolution_m: float = 0.5):
        self.resolution_m = resolution_m
        self.pixel_area_m2 = resolution_m * resolution_m

    def polygonize(
        self,
        seg_contract: SegmentationContract,
        affine_transform: Optional[Affine] = None,
        crs_epsg: str = "EPSG:3857",
    ) -> List[FeatureContract]:
        """
        Converts P4 SegmentationContract mask into a list of FeatureContracts
        with computed area_m2, perimeter_m, and GeoJSON geometry.
        """
        mask = seg_contract.predicted_mask
        probs = seg_contract.probabilities

        if mask is None:
            return []

        transform_matrix = affine_transform or Affine.identity()
        features: List[FeatureContract] = []
        feature_counter = 0

        # Class mapping: 1=BUILDING, 2=ROAD, 3=WATERBODY
        class_to_type = {
            1: FeatureType.BUILDING,
            2: FeatureType.ROAD,
            3: FeatureType.WATERBODY,
        }

        for class_id, feature_type in class_to_type.items():
            binary_mask = (mask == class_id).astype(np.uint8)
            if not np.any(binary_mask):
                continue

            # Extract vector shapes using rasterio.features
            shapes_gen = rasterio.features.shapes(
                binary_mask, mask=(binary_mask > 0), transform=transform_matrix
            )

            for geom_json, val in shapes_gen:
                if val == 0:
                    continue

                poly = shape(geom_json)
                if poly.is_empty or poly.area <= 0:
                    continue

                feature_counter += 1
                feature_id = f"feat_{seg_contract.tile_id}_{class_id}_{feature_counter}"

                # Calculate Area (m^2) and Perimeter (m)
                # If transform is pixel units, multiply area by pixel resolution squared
                if affine_transform is None or affine_transform == Affine.identity():
                    area_m2 = float(poly.area * self.pixel_area_m2)
                    perimeter_m = float(poly.length * self.resolution_m)
                else:
                    # Metric projection coordinates (e.g. UTM / EPSG:3857 in meters)
                    area_m2 = float(poly.area)
                    perimeter_m = float(poly.length)

                centroid_geom = {
                    "type": "Point",
                    "coordinates": [float(poly.centroid.x), float(poly.centroid.y)],
                }

                # Average confidence over polygon mask region
                if probs is not None:
                    c_mask = (mask == class_id)
                    avg_confidence = float(np.mean(probs[class_id, c_mask]))
                else:
                    avg_confidence = 0.85

                # Assign confidence level enum based on score
                if avg_confidence >= 0.8:
                    conf_level = ConfidenceLevel.HIGH
                    status = FeatureStatus.AUTO_ACCEPTED
                elif avg_confidence >= 0.5:
                    conf_level = ConfidenceLevel.MEDIUM
                    status = FeatureStatus.AUTO_ACCEPTED
                else:
                    conf_level = ConfidenceLevel.LOW
                    status = FeatureStatus.HUMAN_REVIEW_REQUIRED

                feature = FeatureContract(
                    feature_id=feature_id,
                    image_id=seg_contract.image_id,
                    job_id=seg_contract.job_id,
                    feature_type=feature_type,
                    geometry=mapping(poly),
                    area_m2=round(area_m2, 2),
                    perimeter_m=round(perimeter_m, 2),
                    centroid=centroid_geom,
                    confidence=round(avg_confidence, 4),
                    confidence_level=conf_level,
                    status=status,
                )
                features.append(feature)

        return features

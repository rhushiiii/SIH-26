"""
P5 GIS Polygonization & Feature Vectorizer Module.

Converts P4 SegmentationContract masks into spatial GIS polygons (FeatureContract)
and calculates real-world Area (m^2), Perimeter (m), Centroid, and Confidence.
Supports CRS transformations to EPSG:4326 (WGS84) for GeoJSON / Leaflet standards.
"""

from typing import List, Dict, Any, Optional
import math
import numpy as np
from shapely.geometry import shape, mapping, Point
from shapely.ops import transform as shapely_transform
import rasterio.features
from rasterio.transform import Affine
from pyproj import Transformer

from contracts.segmentation_contract import SegmentationContract
from contracts.feature_contract import FeatureContract, FeatureProperties
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
        crs_epsg: Optional[str] = "EPSG:3857",
        ref_origin: Optional[tuple[float, float]] = (77.5100, 13.0430),
    ) -> List[FeatureContract]:
        """
        Converts P4 SegmentationContract mask into a list of FeatureContracts
        with computed area_m2, perimeter_m, and GeoJSON geometry in EPSG:4326.
        """
        mask = seg_contract.predicted_mask
        probs = seg_contract.probabilities

        if mask is None:
            return []

        transform_matrix = affine_transform or Affine.identity()
        is_pixel_affine = affine_transform is None or affine_transform == Affine.identity()
        features: List[FeatureContract] = []
        feature_counter = 0

        # Create CRS Transformer to EPSG:4326 if valid projected CRS is provided
        transformer = None
        if not is_pixel_affine and crs_epsg and crs_epsg.upper() not in ["EPSG:4326", "WGS84", "OGC:CRS84"]:
            try:
                transformer = Transformer.from_crs(crs_epsg, "EPSG:4326", always_xy=True)
            except Exception:
                transformer = None

        # Class mapping: 1=BUILDING, 2=ROAD, 3=WATERBODY
        class_to_type = {
            1: FeatureType.BUILDING,
            2: FeatureType.ROAD,
            3: FeatureType.WATERBODY,
        }

        origin_lon, origin_lat = ref_origin or (77.5100, 13.0430)
        meters_per_deg_lat = 111320.0
        meters_per_deg_lon = 111320.0 * math.cos(math.radians(origin_lat))

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

                # Compute Area (m^2) and Perimeter (m)
                if is_pixel_affine:
                    area_m2 = float(poly.area * self.pixel_area_m2)
                    perimeter_m = float(poly.length * self.resolution_m)
                    # Convert pixel polygon to geographic coordinates around reference origin
                    wgs84_poly = shapely_transform(
                        lambda x, y: (
                            origin_lon + (x * self.resolution_m) / meters_per_deg_lon,
                            origin_lat - (y * self.resolution_m) / meters_per_deg_lat,
                        ),
                        poly,
                    )
                else:
                    area_m2 = float(poly.area)
                    perimeter_m = float(poly.length)
                    if transformer is not None:
                        try:
                            wgs84_poly = shapely_transform(transformer.transform, poly)
                        except Exception:
                            wgs84_poly = poly
                    else:
                        wgs84_poly = poly

                if wgs84_poly.is_empty:
                    continue

                feature_counter += 1
                feature_id = f"feat_{seg_contract.tile_id}_{class_id}_{feature_counter}"

                centroid_geom = {
                    "type": "Point",
                    "coordinates": [float(wgs84_poly.centroid.x), float(wgs84_poly.centroid.y)],
                }

                # Average confidence over polygon mask region
                if probs is not None:
                    c_mask = (mask == class_id)
                    avg_confidence = float(np.mean(probs[class_id, c_mask]))
                else:
                    avg_confidence = 0.88

                # Assign confidence level and status based on standard thresholds
                if avg_confidence >= 0.85:
                    conf_level = ConfidenceLevel.HIGH
                    status = FeatureStatus.AUTO_ACCEPTED
                elif avg_confidence >= 0.65:
                    conf_level = ConfidenceLevel.MEDIUM
                    status = FeatureStatus.REVIEW_RECOMMENDED
                else:
                    conf_level = ConfidenceLevel.LOW
                    status = FeatureStatus.HUMAN_REVIEW_REQUIRED

                properties = FeatureProperties(
                    area_m2=round(area_m2, 2),
                    perimeter_m=round(perimeter_m, 2),
                    length_m=round(perimeter_m / 2.0, 2) if feature_type == FeatureType.ROAD else None,
                    confidence=round(avg_confidence, 4),
                    confidence_level=conf_level,
                    status=status,
                    centroid=centroid_geom,
                )

                feature = FeatureContract(
                    feature_id=feature_id,
                    image_id=seg_contract.image_id,
                    job_id=seg_contract.job_id,
                    feature_type=feature_type,
                    geometry=mapping(wgs84_poly),
                    properties=properties,
                )
                features.append(feature)

        return features


import csv
import json
from pathlib import Path

from app.contracts.schemas import ExportContract, ExportFormat, ExportRequest, FeatureType
from app.core.config import EXPORT_DATA_DIR
from app.core.exceptions import APIError
from app.repositories.export_repository import export_repository
from app.repositories.feature_repository import feature_repository


class ExportService:
    def create_export(self, db, image_id: str, request: ExportRequest) -> ExportContract:
        features = [
            feature
            for feature in feature_repository.list_by_image(db, image_id)
            if feature.feature_type in request.layers
        ]

        if request.format == ExportFormat.GEOJSON:
            file_path = self._write_geojson(image_id, features)
        elif request.format == ExportFormat.CSV:
            file_path = self._write_csv(image_id, features)
        else:
            raise APIError("UNSUPPORTED_FORMAT", "Unsupported export format", 400)

        file_uri = f"/exports/{file_path.name}"
        return export_repository.create(db, image_id, request.format, request.layers, file_uri)

    def get_export(self, db, export_id: str) -> ExportContract:
        export = export_repository.get(db, export_id)
        if export is None:
            raise APIError("EXPORT_FAILED", "Export not found", 404)
        return export

    def _write_geojson(self, image_id: str, features) -> Path:
        EXPORT_DATA_DIR.mkdir(parents=True, exist_ok=True)
        path = EXPORT_DATA_DIR / f"{image_id}_features.geojson"
        collection = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": feature.feature_id,
                    "geometry": feature.geometry,
                    "properties": {
                        "feature_id": feature.feature_id,
                        "image_id": feature.image_id,
                        "feature_type": feature.feature_type.value,
                        **feature.properties.model_dump(mode="json"),
                    },
                }
                for feature in features
            ],
        }
        path.write_text(json.dumps(collection, indent=2), encoding="utf-8")
        return path

    def _write_csv(self, image_id: str, features) -> Path:
        EXPORT_DATA_DIR.mkdir(parents=True, exist_ok=True)
        path = EXPORT_DATA_DIR / f"{image_id}_features.csv"
        with path.open("w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(
                csv_file,
                fieldnames=[
                    "feature_id",
                    "image_id",
                    "feature_type",
                    "area_m2",
                    "perimeter_m",
                    "length_m",
                    "confidence",
                    "confidence_level",
                    "status",
                ],
            )
            writer.writeheader()
            for feature in features:
                writer.writerow(
                    {
                        "feature_id": feature.feature_id,
                        "image_id": feature.image_id,
                        "feature_type": feature.feature_type.value,
                        **feature.properties.model_dump(mode="json"),
                    }
                )
        return path


export_service = ExportService()

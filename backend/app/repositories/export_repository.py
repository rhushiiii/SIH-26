import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.contracts.schemas import ExportContract, ExportFormat, FeatureType
from app.db.models import ExportModel
from app.services.id_factory import id_factory


class ExportRepository:
    def create(
        self,
        db: Session,
        image_id: str,
        export_format: ExportFormat,
        layers: list[FeatureType],
        file_uri: str,
    ) -> ExportContract:
        export = ExportModel(
            export_id=id_factory.next_export_id(),
            image_id=image_id,
            format=export_format.value,
            layers_json=json.dumps([layer.value for layer in layers]),
            file_uri=file_uri,
            created_at=datetime.now(timezone.utc),
        )
        db.add(export)
        db.commit()
        db.refresh(export)
        return self.to_contract(export)

    def get(self, db: Session, export_id: str) -> ExportContract | None:
        export = db.get(ExportModel, export_id)
        return self.to_contract(export) if export else None

    def to_contract(self, export: ExportModel) -> ExportContract:
        return ExportContract(
            export_id=export.export_id,
            image_id=export.image_id,
            format=ExportFormat(export.format),
            layers=[FeatureType(layer) for layer in json.loads(export.layers_json)],
            file_uri=export.file_uri,
            created_at=export.created_at,
        )


export_repository = ExportRepository()

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.contracts.envelope import ok
from app.contracts.schemas import ExportRequest
from app.db.session import get_db
from app.gis.export_service import export_service

router = APIRouter(tags=["exports"])


@router.post("/images/{image_id}/exports")
def create_export(image_id: str, request: ExportRequest, db: Session = Depends(get_db)):
    export = export_service.create_export(db, image_id, request)
    return ok(export.model_dump(mode="json"))


@router.get("/exports")
def list_exports(db: Session = Depends(get_db)):
    exports = export_service.list_exports(db)
    return ok(
        {
            "items": [export.model_dump(mode="json") for export in exports],
            "total": len(exports),
            "page": 1,
            "page_size": len(exports) or 20,
        },
        meta={"total": len(exports)},
    )


@router.get("/exports/{export_id}")
def get_export(export_id: str, db: Session = Depends(get_db)):
    export = export_service.get_export(db, export_id)
    return ok(export.model_dump(mode="json"))


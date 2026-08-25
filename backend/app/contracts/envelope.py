from typing import Any, Optional

from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    code: str
    message: str


class APIEnvelope(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorBody] = None
    meta: dict[str, Any] = Field(default_factory=dict)


def ok(data: Any, meta: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "error": None,
        "meta": meta or {},
    }


def fail(code: str, message: str, meta: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    return {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
        },
        "meta": meta or {},
    }

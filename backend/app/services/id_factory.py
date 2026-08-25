from itertools import count
from uuid import uuid4


class IdFactory:
    def __init__(self) -> None:
        self._image_counter = count(1)
        self._job_counter = count(1)
        self._review_counter = count(1)
        self._export_counter = count(1)

    def next_image_id(self) -> str:
        return f"img_{next(self._image_counter):06d}"

    def next_job_id(self) -> str:
        return f"job_{next(self._job_counter):06d}"

    def next_review_id(self) -> str:
        return f"review_{next(self._review_counter):06d}_{uuid4().hex[:8]}"

    def next_export_id(self) -> str:
        return f"export_{next(self._export_counter):06d}_{uuid4().hex[:8]}"


id_factory = IdFactory()

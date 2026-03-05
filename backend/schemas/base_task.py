"""Base class for all queue task payloads.

Provides shared ClassVar metadata (TASK_TYPE, QUEUE_NAME) and a
``log_summary()`` hook so that BaseWorker can emit structured lifecycle
logs without knowing the concrete task type.
"""

from typing import ClassVar

from pydantic import BaseModel


class BaseTask(BaseModel):
    """Abstract base for queue task schemas.

    Subclasses must set ``TASK_TYPE`` and ``QUEUE_NAME`` and implement
    ``log_summary()``.

    ``ClassVar`` fields are excluded from Pydantic serialization, so
    existing Redis payloads are unaffected.
    """

    TASK_TYPE: ClassVar[str] = ""
    QUEUE_NAME: ClassVar[str] = ""

    def log_summary(self) -> dict:
        """Return key fields for structured logging.

        Override in subclasses to include task-specific context
        (user_id, job_count, etc.).
        """
        return {}

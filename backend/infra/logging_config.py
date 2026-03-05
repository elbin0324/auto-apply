"""Structured JSON logging for Railway observability.

Use ``setup_logging("worker_name")`` at process startup.  When ``log_format``
is ``"json"`` (the default) each log line is a single JSON object that Railway
can parse, filter, and search.  Set ``LOG_FORMAT=text`` in ``.env`` for
human-readable output during local development.
"""

import json
import logging
import sys
import traceback
from datetime import datetime, timezone

from config import get_settings

# Thread-local (well, asyncio-task-local) storage for correlation context
_task_id: str = ""
_correlation_id: str = ""


def set_task_id(task_id: str) -> None:
    """Set the current task_id for log correlation."""
    global _task_id
    _task_id = task_id


def clear_task_id() -> None:
    global _task_id
    _task_id = ""


def set_correlation_id(correlation_id: str) -> None:
    """Set the current correlation_id for cross-queue tracing."""
    global _correlation_id
    _correlation_id = correlation_id


def clear_correlation_id() -> None:
    global _correlation_id
    _correlation_id = ""


class JSONFormatter(logging.Formatter):
    """Emit each log record as a single JSON line."""

    def __init__(self, worker_name: str = ""):
        super().__init__()
        self.worker_name = worker_name

    def format(self, record: logging.LogRecord) -> str:
        entry: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if self.worker_name:
            entry["worker"] = self.worker_name
        if _task_id:
            entry["task_id"] = _task_id
        if _correlation_id:
            entry["correlation_id"] = _correlation_id
        if record.exc_info and record.exc_info[1] is not None:
            entry["exception"] = "".join(traceback.format_exception(*record.exc_info))
        # Merge structured extra data (e.g. lifecycle events) as flat keys
        data = getattr(record, "data", None)
        if isinstance(data, dict):
            entry.update(data)
        return json.dumps(entry, default=str)


class _PrintHandler(logging.Handler):
    """Logging handler that uses print() — guaranteed to appear in Railway.

    StreamHandler writes to a captured sys.stdout reference and may not flush
    reliably in containerized environments. print() always works.
    """

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            print(msg, flush=True)
        except Exception:
            self.handleError(record)


def setup_logging(worker_name: str = "", level: str | None = None) -> None:
    """Configure the root logger for structured or plain-text output.

    Call once at process startup before any other logging.
    """
    settings = get_settings()
    log_level = getattr(logging, (level or settings.log_level).upper(), logging.INFO)

    root = logging.getLogger()
    root.setLevel(log_level)

    # Remove any existing handlers (e.g. from basicConfig)
    root.handlers.clear()

    handler = _PrintHandler()
    handler.setLevel(log_level)

    if settings.log_format == "json":
        handler.setFormatter(JSONFormatter(worker_name=worker_name))
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        )

    root.addHandler(handler)

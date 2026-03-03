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

# Thread-local (well, asyncio-task-local) storage for the current task_id
_task_id: str = ""


def set_task_id(task_id: str) -> None:
    """Set the current task_id for log correlation."""
    global _task_id
    _task_id = task_id


def clear_task_id() -> None:
    global _task_id
    _task_id = ""


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
        if record.exc_info and record.exc_info[1] is not None:
            entry["exception"] = "".join(traceback.format_exception(*record.exc_info))
        return json.dumps(entry, default=str)


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

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)

    if settings.log_format == "json":
        handler.setFormatter(JSONFormatter(worker_name=worker_name))
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        )

    root.addHandler(handler)

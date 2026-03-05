"""Shared queue consumer utilities.

Provides ``pop_task`` — a generic BLPOP + envelope-aware deserializer
that all per-queue pop functions delegate to.
"""

import json
import logging
from typing import TypeVar

from pydantic import BaseModel

from infra.redis_pool import get_redis
from schemas.task_envelope import TaskEnvelope

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


async def pop_task(
    queue: str, task_cls: type[T], *, timeout: int = 5
) -> tuple[TaskEnvelope, T] | None:
    """Pop one task from *queue*, returning ``(envelope, task)`` or ``None``.

    Handles both envelope-wrapped and legacy bare-task payloads.
    """
    redis = get_redis()
    result = await redis.blpop(queue, timeout=timeout)
    if result is None:
        return None
    _, raw = result
    data = json.loads(raw)
    if "task_id" in data and "payload" in data:
        envelope = TaskEnvelope.model_validate(data)
        task = task_cls.model_validate_json(envelope.payload)
    else:
        task = task_cls.model_validate(data)
        envelope = TaskEnvelope(
            source_worker="unknown",
            queue_name=queue,
            payload=task.model_dump_json(),
        )
    return envelope, task

"""Tests for BaseTask ABC and queue task schemas."""

import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from schemas.base_task import BaseTask
from schemas.enrichment import EnrichJobsTask
from schemas.queue_tasks import FetchJobsTask, ScoreJobsTask
from schemas.task_envelope import TaskEnvelope


_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_JOB_ID = uuid.UUID("aaaa1111-1111-1111-1111-111111111111")


# ── BaseTask ─────────────────────────────────────────────────────────────────


def test_base_task_defaults() -> None:
    task = BaseTask()
    assert task.log_summary() == {}
    assert BaseTask.TASK_TYPE == ""
    assert BaseTask.QUEUE_NAME == ""


# ── FetchJobsTask ────────────────────────────────────────────────────────────


def test_fetch_jobs_task_class_vars() -> None:
    assert FetchJobsTask.TASK_TYPE == "fetch_jobs"
    assert FetchJobsTask.QUEUE_NAME == "fetch:jobs"


def test_fetch_jobs_task_log_summary() -> None:
    task = FetchJobsTask(user_id=_USER_ID, recent_only=True)
    summary = task.log_summary()
    assert summary["user_id"] == str(_USER_ID)
    assert summary["recent_only"] is True


def test_fetch_jobs_task_classvar_excluded_from_serialization() -> None:
    task = FetchJobsTask(user_id=_USER_ID)
    data = json.loads(task.model_dump_json())
    assert "TASK_TYPE" not in data
    assert "QUEUE_NAME" not in data
    assert "user_id" in data


# ── ScoreJobsTask ────────────────────────────────────────────────────────────


def test_score_jobs_task_class_vars() -> None:
    assert ScoreJobsTask.TASK_TYPE == "score_jobs"
    assert ScoreJobsTask.QUEUE_NAME == "score:jobs"


def test_score_jobs_task_log_summary() -> None:
    task = ScoreJobsTask(user_id=_USER_ID, force=True)
    summary = task.log_summary()
    assert summary["user_id"] == str(_USER_ID)
    assert summary["force"] is True


def test_score_jobs_task_classvar_excluded_from_serialization() -> None:
    task = ScoreJobsTask(user_id=_USER_ID, force=True)
    data = json.loads(task.model_dump_json())
    assert "TASK_TYPE" not in data
    assert "QUEUE_NAME" not in data
    assert "user_id" in data
    assert "force" in data


# ── Generic pop helper ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_generic_pop_empty_queue() -> None:
    from workers.queues import pop_task

    mock_redis = AsyncMock()
    mock_redis.blpop = AsyncMock(return_value=None)

    with patch("workers.queues.get_redis", return_value=mock_redis):
        result = await pop_task("fetch:jobs", FetchJobsTask)

    assert result is None


@pytest.mark.asyncio
async def test_generic_pop_envelope_format() -> None:
    from workers.queues import pop_task

    inner_task = FetchJobsTask(user_id=_USER_ID, recent_only=True)
    envelope = TaskEnvelope(
        task_type="fetch_jobs",
        queue_name="fetch:jobs",
        user_id=str(_USER_ID),
        source="test",
        payload=inner_task.model_dump_json(),
    )

    mock_redis = AsyncMock()
    mock_redis.blpop = AsyncMock(
        return_value=("fetch:jobs", envelope.model_dump_json())
    )

    with patch("workers.queues.get_redis", return_value=mock_redis):
        result = await pop_task("fetch:jobs", FetchJobsTask)

    assert result is not None
    env, task = result
    assert task.user_id == _USER_ID
    assert task.recent_only is True
    assert env.task_type == "fetch_jobs"
    assert env.source == "test"


@pytest.mark.asyncio
async def test_generic_pop_legacy_format() -> None:
    from workers.queues import pop_task

    bare_task = FetchJobsTask(user_id=_USER_ID)

    mock_redis = AsyncMock()
    mock_redis.blpop = AsyncMock(
        return_value=("fetch:jobs", bare_task.model_dump_json())
    )

    with patch("workers.queues.get_redis", return_value=mock_redis):
        result = await pop_task("fetch:jobs", FetchJobsTask)

    assert result is not None
    env, task = result
    assert task.user_id == _USER_ID
    assert env.source_worker == "unknown"
    assert env.queue_name == "fetch:jobs"


@pytest.mark.asyncio
async def test_generic_pop_score_task() -> None:
    from workers.queues import pop_task

    inner_task = ScoreJobsTask(user_id=_USER_ID, force=True)
    envelope = TaskEnvelope(
        task_type="score_jobs",
        queue_name="score:jobs",
        payload=inner_task.model_dump_json(),
    )

    mock_redis = AsyncMock()
    mock_redis.blpop = AsyncMock(
        return_value=("score:jobs", envelope.model_dump_json())
    )

    with patch("workers.queues.get_redis", return_value=mock_redis):
        result = await pop_task("score:jobs", ScoreJobsTask)

    assert result is not None
    _, task = result
    assert task.force is True


@pytest.mark.asyncio
async def test_generic_pop_enrich_task() -> None:
    from workers.queues import pop_task

    inner_task = EnrichJobsTask(job_ids=[_JOB_ID], user_id=_USER_ID)
    envelope = TaskEnvelope(
        task_type="enrich_jobs",
        queue_name="enrich:jobs",
        payload=inner_task.model_dump_json(),
    )

    mock_redis = AsyncMock()
    mock_redis.blpop = AsyncMock(
        return_value=("enrich:jobs", envelope.model_dump_json())
    )

    with patch("workers.queues.get_redis", return_value=mock_redis):
        result = await pop_task("enrich:jobs", EnrichJobsTask)

    assert result is not None
    _, task = result
    assert task.job_ids == [_JOB_ID]
    assert task.user_id == _USER_ID


# ── JSONFormatter extra data ─────────────────────────────────────────────────


def test_json_formatter_includes_extra_data() -> None:
    import logging

    from infra.logging_config import JSONFormatter

    formatter = JSONFormatter(worker_name="test")
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Test message",
        args=(),
        exc_info=None,
    )
    record.data = {"event": "task_dequeued", "task_type": "fetch_jobs"}  # type: ignore[attr-defined]

    output = formatter.format(record)
    parsed = json.loads(output)

    assert parsed["event"] == "task_dequeued"
    assert parsed["task_type"] == "fetch_jobs"
    assert parsed["message"] == "Test message"
    assert parsed["worker"] == "test"


def test_json_formatter_no_extra_data() -> None:
    import logging

    from infra.logging_config import JSONFormatter

    formatter = JSONFormatter(worker_name="test")
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Plain message",
        args=(),
        exc_info=None,
    )

    output = formatter.format(record)
    parsed = json.loads(output)

    assert parsed["message"] == "Plain message"
    assert "event" not in parsed

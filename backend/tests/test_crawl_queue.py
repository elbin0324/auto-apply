"""Tests for crawl queue + score queue services, crawl scheduler, and task schemas."""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from schemas.crawl import (
    CrawlQueueStatus,
    CrawlTask,
    EmbeddingStats,
    ScoreJobsTask,
    ScoreUserTask,
)


_COMPANY_ID = uuid.UUID("cccc1111-1111-1111-1111-111111111111")
_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_JOB_ID = uuid.UUID("aaaa1111-1111-1111-1111-111111111111")


# ── Schema serialization roundtrip ──────────────────────────────────────────


def test_crawl_task_roundtrip() -> None:
    task = CrawlTask(
        company_id=_COMPANY_ID,
        company_slug="acme",
        ats_type="greenhouse",
        priority=1,
    )
    data = task.model_dump_json()
    restored = CrawlTask.model_validate_json(data)
    assert restored.company_id == _COMPANY_ID
    assert restored.company_slug == "acme"
    assert restored.priority == 1


def test_score_jobs_task_roundtrip() -> None:
    task = ScoreJobsTask(company_id=_COMPANY_ID, job_ids=[_JOB_ID])
    data = task.model_dump_json()
    restored = ScoreJobsTask.model_validate_json(data)
    assert restored.job_ids == [_JOB_ID]


def test_score_user_task_roundtrip() -> None:
    task = ScoreUserTask(user_id=_USER_ID, reason="profile_update")
    data = task.model_dump_json()
    restored = ScoreUserTask.model_validate_json(data)
    assert restored.user_id == _USER_ID
    assert restored.reason == "profile_update"


def test_score_user_task_default_reason() -> None:
    task = ScoreUserTask(user_id=_USER_ID)
    assert task.reason == "profile_update"


def test_crawl_queue_status_schema() -> None:
    s = CrawlQueueStatus(
        crawl_queue_depth=5,
        score_jobs_queue_depth=3,
        score_users_queue_depth=1,
        apply_queue_depth=10,
    )
    assert s.crawl_queue_depth == 5
    assert s.apply_queue_depth == 10


def test_embedding_stats_schema() -> None:
    s = EmbeddingStats(
        jobs_total=1000,
        jobs_embedded=800,
        profiles_total=50,
        profiles_embedded=45,
    )
    assert s.jobs_total == 1000
    assert s.profiles_embedded == 45


# ── Crawl queue service ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_push_crawl_task_with_dedup() -> None:
    """push_crawl_task should set a dedup key and RPUSH to queue."""
    from services.crawl_queue_service import push_crawl_task

    task = CrawlTask(
        company_id=_COMPANY_ID,
        company_slug="acme",
        ats_type="greenhouse",
    )

    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(return_value=True)  # NX returns True = key was set
    mock_redis.rpush = AsyncMock()

    with patch("services.crawl_queue_service.get_redis", return_value=mock_redis):
        result = await push_crawl_task(task)

    assert result is True
    mock_redis.set.assert_called_once()
    mock_redis.rpush.assert_called_once()


@pytest.mark.asyncio
async def test_push_crawl_task_dedup_blocks() -> None:
    """push_crawl_task should skip RPUSH if dedup key already exists."""
    from services.crawl_queue_service import push_crawl_task

    task = CrawlTask(
        company_id=_COMPANY_ID,
        company_slug="acme",
        ats_type="greenhouse",
    )

    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(return_value=None)  # NX returns None = key existed

    with patch("services.crawl_queue_service.get_redis", return_value=mock_redis):
        result = await push_crawl_task(task)

    assert result is False
    mock_redis.rpush.assert_not_called()


# ── Score queue service ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_push_score_user_task_with_dedup() -> None:
    """push_score_user_task should set a dedup key and RPUSH."""
    from services.score_queue_service import push_score_user_task

    task = ScoreUserTask(user_id=_USER_ID, reason="profile_update")

    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.rpush = AsyncMock()

    with patch("services.score_queue_service.get_redis", return_value=mock_redis):
        await push_score_user_task(task)

    mock_redis.rpush.assert_called_once()


@pytest.mark.asyncio
async def test_push_score_jobs_task() -> None:
    """push_score_jobs_task should RPUSH without dedup."""
    from services.score_queue_service import push_score_jobs_task

    task = ScoreJobsTask(company_id=_COMPANY_ID, job_ids=[_JOB_ID])

    mock_redis = AsyncMock()
    mock_redis.rpush = AsyncMock()

    with patch("services.score_queue_service.get_redis", return_value=mock_redis):
        await push_score_jobs_task(task)

    mock_redis.rpush.assert_called_once()


# ── Crawl scheduler ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_stale_companies_returns_never_crawled() -> None:
    """Companies with last_crawled_at=None should be included."""
    from services.crawl_scheduler import get_stale_companies

    mock_company = MagicMock()
    mock_company.last_crawled_at = None
    mock_company.is_active = True

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_company]

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)

    companies = await get_stale_companies(mock_db, stale_hours=6)
    assert len(companies) == 1


@pytest.mark.asyncio
async def test_enqueue_stale_companies_pushes_tasks() -> None:
    """enqueue_stale_companies should push CrawlTask for each stale company."""
    from services.crawl_scheduler import enqueue_stale_companies

    mock_company = MagicMock()
    mock_company.id = _COMPANY_ID
    mock_company.slug = "acme"
    mock_company.ats_type = "greenhouse"
    mock_company.last_crawled_at = None

    with (
        patch("services.crawl_scheduler.get_stale_companies", new_callable=AsyncMock, return_value=[mock_company]),
        patch("services.crawl_scheduler.push_crawl_task", new_callable=AsyncMock, return_value=True) as mock_push,
    ):
        mock_db = AsyncMock()
        stats = await enqueue_stale_companies(mock_db)

    assert stats["enqueued"] == 1
    assert stats["stale_companies"] == 1
    mock_push.assert_called_once()


@pytest.mark.asyncio
async def test_enqueue_stale_companies_counts_skipped() -> None:
    """Already-enqueued companies should be counted as skipped."""
    from services.crawl_scheduler import enqueue_stale_companies

    mock_company = MagicMock()
    mock_company.id = _COMPANY_ID
    mock_company.slug = "acme"
    mock_company.ats_type = "greenhouse"
    mock_company.last_crawled_at = None

    with (
        patch("services.crawl_scheduler.get_stale_companies", new_callable=AsyncMock, return_value=[mock_company]),
        patch("services.crawl_scheduler.push_crawl_task", new_callable=AsyncMock, return_value=False),
    ):
        mock_db = AsyncMock()
        stats = await enqueue_stale_companies(mock_db)

    assert stats["skipped_already_enqueued"] == 1
    assert stats["enqueued"] == 0

"""Background worker tests.

Tests cover the arq task functions (task_sync_jobs, task_rematch_active_users),
the scheduler health endpoint, and the manual rematch endpoint.
"""

import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

_USER_ID_1 = uuid.UUID("11111111-1111-1111-1111-111111111111")
_USER_ID_2 = uuid.UUID("22222222-2222-2222-2222-222222222222")


# ── Helpers ──────────────────────────────────────────────────────────────────


def _mock_active_config(user_id: uuid.UUID, **overrides: object) -> SimpleNamespace:
    defaults: dict = {
        "id": uuid.uuid4(),
        "user_id": user_id,
        "is_active": True,
        "target_titles": ["Software Engineer"],
        "target_locations": ["Remote"],
        "daily_apply_limit": 25,
        "require_review": False,
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _mock_db_factory() -> AsyncMock:
    """Create a mock db factory that returns an async context manager."""
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    context = AsyncMock()
    context.__aenter__ = AsyncMock(return_value=session)
    context.__aexit__ = AsyncMock(return_value=False)

    factory = MagicMock(return_value=context)
    return factory, session


# ── task_sync_jobs tests ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_task_sync_jobs_calls_sync_and_scoring() -> None:
    from worker import task_sync_jobs

    factory, session = _mock_db_factory()
    ctx: dict = {"db_factory": factory}

    sync_result = {
        "jobs_fetched": 50,
        "jobs_upserted": 45,
        "jobs_deactivated": 3,
        "synced_external_ids": ["ext-1", "ext-2"],
    }
    score_result = {"scores_computed": 10}

    with (
        patch(
            "services.job_sync.run_sync",
            new_callable=AsyncMock,
            return_value=sync_result,
        ),
        patch(
            "services.job_matcher.compute_scores_for_sync",
            new_callable=AsyncMock,
            return_value=score_result,
        ),
    ):
        result = await task_sync_jobs(ctx)

    assert result["sync"]["jobs_fetched"] == 50
    assert result["scoring"]["scores_computed"] == 10
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_task_sync_jobs_rollback_on_error() -> None:
    from worker import task_sync_jobs

    factory, session = _mock_db_factory()
    ctx: dict = {"db_factory": factory}

    with (
        patch(
            "services.job_sync.run_sync",
            new_callable=AsyncMock,
            side_effect=RuntimeError("adzuna down"),
        ),
        pytest.raises(RuntimeError, match="adzuna down"),
    ):
        await task_sync_jobs(ctx)

    session.rollback.assert_awaited_once()


# ── task_rematch_active_users tests ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_task_rematch_no_active_users() -> None:
    from worker import task_rematch_active_users

    factory, session = _mock_db_factory()
    ctx: dict = {"db_factory": factory}

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    session.execute = AsyncMock(return_value=mock_result)

    result = await task_rematch_active_users(ctx)

    assert result["users_processed"] == 0
    assert result["total_queued"] == 0


@pytest.mark.asyncio
async def test_task_rematch_processes_active_users() -> None:
    from worker import task_rematch_active_users

    factory, session = _mock_db_factory()
    ctx: dict = {"db_factory": factory}

    configs = [
        _mock_active_config(_USER_ID_1),
        _mock_active_config(_USER_ID_2),
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = configs
    session.execute = AsyncMock(return_value=mock_result)

    match_result = {"matched": 5, "queued": 3, "skipped_already_applied": 2}

    with patch(
        "services.auto_apply_service.run_matching_for_user",
        new_callable=AsyncMock,
        return_value=match_result,
    ) as mock_match:
        result = await task_rematch_active_users(ctx)

    assert result["users_processed"] == 2
    assert result["total_queued"] == 6
    assert mock_match.await_count == 2
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_task_rematch_continues_on_individual_user_error() -> None:
    from worker import task_rematch_active_users

    factory, session = _mock_db_factory()
    ctx: dict = {"db_factory": factory}

    configs = [
        _mock_active_config(_USER_ID_1),
        _mock_active_config(_USER_ID_2),
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = configs
    session.execute = AsyncMock(return_value=mock_result)

    # First user fails, second succeeds
    match_result = {"matched": 2, "queued": 1}

    with patch(
        "services.auto_apply_service.run_matching_for_user",
        new_callable=AsyncMock,
        side_effect=[RuntimeError("db error"), match_result],
    ):
        result = await task_rematch_active_users(ctx)

    # Should still process user 2 despite user 1 failing
    assert result["users_processed"] == 1
    assert result["total_queued"] == 1


# ── WorkerSettings tests ────────────────────────────────────────────────────


def test_worker_settings_has_cron_jobs() -> None:
    from worker import WorkerSettings

    assert len(WorkerSettings.cron_jobs) == 3
    assert len(WorkerSettings.functions) == 3
    assert WorkerSettings.queue_name == "arq:scheduler"


# ── Scheduler health endpoint tests ─────────────────────────────────────────


def test_scheduler_health_returns_ok() -> None:
    with patch("routers.health.aioredis") as mock_redis_mod:
        mock_redis = AsyncMock()
        mock_redis.keys = AsyncMock(return_value=[b"arq:worker:abc123"])
        mock_redis.aclose = AsyncMock()
        mock_redis_mod.from_url.return_value = mock_redis

        resp = client.get("/api/health/scheduler")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["worker_count"] == 1


def test_scheduler_health_warning_no_workers() -> None:
    with patch("routers.health.aioredis") as mock_redis_mod:
        mock_redis = AsyncMock()
        mock_redis.keys = AsyncMock(return_value=[])
        mock_redis.aclose = AsyncMock()
        mock_redis_mod.from_url.return_value = mock_redis

        resp = client.get("/api/health/scheduler")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "warning"
    assert data["worker_count"] == 0


# ── Manual rematch endpoint tests ────────────────────────────────────────────

_INTERNAL_API_KEY = "test-internal-key"


def _mock_user() -> MagicMock:
    user = MagicMock()
    user.id = _USER_ID_1
    return user


def test_rematch_requires_internal_api_key() -> None:
    resp = client.post("/api/internal/scheduler/rematch")
    assert resp.status_code in (403, 422)


def test_rematch_endpoint_runs_matching() -> None:
    from db.session import get_db
    from deps import verify_internal_api_key

    configs = [_mock_active_config(_USER_ID_1)]

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = configs
    mock_db.execute = AsyncMock(return_value=mock_result)

    match_result = {"matched": 3, "queued": 2}

    app.dependency_overrides[verify_internal_api_key] = lambda: None
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        with patch(
            "routers.applications.run_matching_for_user",
            new_callable=AsyncMock,
            return_value=match_result,
        ):
            resp = client.post(
                "/api/internal/scheduler/rematch",
                headers={"X-Internal-API-Key": _INTERNAL_API_KEY},
            )
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["users_processed"] == 1
    assert data["total_queued"] == 2


# ── Job sync config tests ───────────────────────────────────────────────────


def test_settings_has_adzuna_sync_fields() -> None:
    """Verify the new configurable sync settings exist with defaults."""
    from config import Settings

    fields = Settings.model_fields
    assert "adzuna_sync_country" in fields
    assert "adzuna_sync_categories" in fields
    assert "adzuna_sync_pages" in fields

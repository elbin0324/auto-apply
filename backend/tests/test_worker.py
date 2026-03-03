"""Background worker tests.

Tests cover the arq task functions (task_fetch_jobs_for_users, task_rematch_active_users),
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
        "apply_mode": "auto",
        "auto_apply_threshold": 70,
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


# ── task_fetch_jobs_for_users tests ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_task_fetch_skips_when_no_api_key() -> None:
    from worker import task_fetch_jobs_for_users

    factory, session = _mock_db_factory()
    ctx: dict = {"db_factory": factory}

    with patch("worker.get_settings") as mock_settings:
        mock_settings.return_value.rapidapi_key = ""
        result = await task_fetch_jobs_for_users(ctx)

    assert result["skipped"] is True
    assert "fantastic_not_configured" in result["reason"]


@pytest.mark.asyncio
async def test_task_fetch_calls_service_with_recent_only() -> None:
    from worker import task_fetch_jobs_for_users

    factory, session = _mock_db_factory()
    ctx: dict = {"db_factory": factory}

    fetch_result = {"users_processed": 2, "total_jobs_fetched": 50}

    with (
        patch("worker.get_settings") as mock_settings,
        patch(
            "services.job_fetch_service.fetch_jobs_for_all_active_users",
            new_callable=AsyncMock,
            return_value=fetch_result,
        ) as mock_fetch,
    ):
        mock_settings.return_value.rapidapi_key = "test-key"
        result = await task_fetch_jobs_for_users(ctx)

    # Daily cron should pass recent_only=True (24h endpoint)
    mock_fetch.assert_awaited_once()
    call_kwargs = mock_fetch.call_args
    assert call_kwargs.kwargs.get("recent_only") is True

    assert result["users_processed"] == 2
    assert result["total_jobs_fetched"] == 50


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

    assert len(WorkerSettings.cron_jobs) == 2
    assert len(WorkerSettings.functions) == 3
    assert WorkerSettings.queue_name == "arq:scheduler"


# ── Scheduler health endpoint tests ─────────────────────────────────────────


def test_scheduler_health_returns_ok() -> None:
    mock_redis = AsyncMock()
    mock_redis.keys = AsyncMock(return_value=[b"arq:worker:abc123"])

    with patch("routers.health.get_redis", return_value=mock_redis):
        resp = client.get("/api/health/scheduler")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["worker_count"] == 1


def test_scheduler_health_warning_no_workers() -> None:
    mock_redis = AsyncMock()
    mock_redis.keys = AsyncMock(return_value=[])

    with patch("routers.health.get_redis", return_value=mock_redis):
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


# ── Config tests ─────────────────────────────────────────────────────────────


def test_settings_has_fantastic_fields() -> None:
    """Verify the Fantastic Jobs API settings exist with defaults."""
    from config import Settings

    fields = Settings.model_fields
    assert "rapidapi_key" in fields
    assert "fantastic_results_per_query" in fields
    assert "fantastic_top_n_to_enrich" in fields

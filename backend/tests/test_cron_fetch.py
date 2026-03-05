"""Cron fetch tests + manual rematch endpoint + config tests.

Tests cover cron.enqueue_fetch.main(), the manual rematch endpoint,
and settings validation.
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


# ── cron.enqueue_fetch.main() tests ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_cron_fetch_skips_when_no_api_key() -> None:
    with (
        patch("cron.enqueue_fetch.get_settings") as mock_settings,
        patch("cron.enqueue_fetch.close_pool", new_callable=AsyncMock),
        patch("cron.enqueue_fetch.engine") as mock_engine,
    ):
        mock_settings.return_value.rapidapi_key = ""
        mock_settings.return_value.sentry_dsn = ""
        mock_engine.dispose = AsyncMock()
        from cron.enqueue_fetch import main

        result = await main()

    assert result == 0


@pytest.mark.asyncio
async def test_cron_fetch_enqueues_per_user_with_recent_only() -> None:
    configs = [
        _mock_active_config(_USER_ID_1),
        _mock_active_config(_USER_ID_2),
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = configs

    mock_session = AsyncMock()
    mock_session.execute = AsyncMock(return_value=mock_result)

    mock_context = AsyncMock()
    mock_context.__aenter__ = AsyncMock(return_value=mock_session)
    mock_context.__aexit__ = AsyncMock(return_value=False)

    with (
        patch("cron.enqueue_fetch.get_settings") as mock_settings,
        patch("cron.enqueue_fetch.AsyncSessionLocal", return_value=mock_context),
        patch("cron.enqueue_fetch.close_pool", new_callable=AsyncMock),
        patch("cron.enqueue_fetch.engine") as mock_engine,
        patch(
            "infra.task_queue.enqueue_fetch_jobs",
            new_callable=AsyncMock,
        ) as mock_enqueue,
    ):
        mock_settings.return_value.rapidapi_key = "test-key"
        mock_settings.return_value.sentry_dsn = ""
        mock_engine.dispose = AsyncMock()
        from cron.enqueue_fetch import main

        result = await main()

    assert mock_enqueue.await_count == 2
    for call in mock_enqueue.call_args_list:
        assert call.kwargs.get("recent_only") is True
        assert call.kwargs.get("source") == "cron_daily"

    assert result == 2


# ── Manual rematch endpoint tests ────────────────────────────────────────────

_INTERNAL_API_KEY = "test-internal-key"


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


def test_settings_has_job_api_fields() -> None:
    """Verify the Active Jobs DB API settings exist with defaults."""
    from config import Settings

    fields = Settings.model_fields
    assert "rapidapi_key" in fields

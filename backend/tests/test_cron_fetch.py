"""Cron fetch endpoint tests + manual rematch endpoint + config tests.

Tests cover POST /api/internal/scheduler/fetch, the manual rematch endpoint,
and settings validation.
"""

import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

_USER_ID_1 = uuid.UUID("11111111-1111-1111-1111-111111111111")
_USER_ID_2 = uuid.UUID("22222222-2222-2222-2222-222222222222")
_INTERNAL_API_KEY = "test-internal-key"


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


def _override_deps(mock_db: AsyncMock, **settings_overrides: object) -> None:
    from config import Settings, get_settings
    from db.session import get_db
    from deps import verify_internal_api_key

    real_settings = get_settings()
    mock_settings = MagicMock(spec=Settings)
    for field in Settings.model_fields:
        setattr(mock_settings, field, getattr(real_settings, field))
    for k, v in settings_overrides.items():
        setattr(mock_settings, k, v)

    app.dependency_overrides[verify_internal_api_key] = lambda: None
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_settings] = lambda: mock_settings


# ── POST /api/internal/scheduler/fetch tests ────────────────────────────────


def test_fetch_requires_internal_api_key() -> None:
    resp = client.post("/api/internal/scheduler/fetch")
    assert resp.status_code in (403, 422)


def test_fetch_skips_when_no_api_key() -> None:
    mock_db = AsyncMock()

    _override_deps(mock_db, rapidapi_key="")
    try:
        resp = client.post(
            "/api/internal/scheduler/fetch",
            headers={"X-Internal-API-Key": _INTERNAL_API_KEY},
        )
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    data = resp.json()
    assert data["users_enqueued"] == 0
    assert data["skipped"] is True


def test_fetch_enqueues_per_user_with_recent_only() -> None:
    configs = [
        _mock_active_config(_USER_ID_1),
        _mock_active_config(_USER_ID_2),
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = configs

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_result)

    _override_deps(mock_db, rapidapi_key="test-key")
    try:
        with patch(
            "infra.task_queue.enqueue_fetch_jobs",
            new_callable=AsyncMock,
        ) as mock_enqueue:
            resp = client.post(
                "/api/internal/scheduler/fetch",
                headers={"X-Internal-API-Key": _INTERNAL_API_KEY},
            )
    finally:
        app.dependency_overrides.clear()

    assert resp.status_code == 200
    assert resp.json()["users_enqueued"] == 2

    assert mock_enqueue.await_count == 2
    for call in mock_enqueue.call_args_list:
        assert call.kwargs.get("recent_only") is True
        assert call.kwargs.get("source") == "cron_daily"


# ── Manual rematch endpoint tests ────────────────────────────────────────────


def test_rematch_requires_internal_api_key() -> None:
    resp = client.post("/api/internal/scheduler/rematch")
    assert resp.status_code in (403, 422)


def test_rematch_endpoint_runs_matching() -> None:
    configs = [_mock_active_config(_USER_ID_1)]

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = configs
    mock_db.execute = AsyncMock(return_value=mock_result)

    match_result = {"matched": 3, "queued": 2}

    from db.session import get_db
    from deps import verify_internal_api_key

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

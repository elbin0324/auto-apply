"""Auth endpoint tests.

These tests mock the Supabase client to avoid real network calls.
Run with: make test
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ── Helpers ────────────────────────────────────────────────────────────────────


def _mock_supabase_user(uid: str = "test-uid-123", email: str = "test@example.com") -> MagicMock:
    user = MagicMock()
    user.id = uid
    user.email = email
    return user


def _mock_supabase_session(token: str = "test-token") -> MagicMock:
    session = MagicMock()
    session.access_token = token
    session.refresh_token = "refresh-token"
    return session


# ── Health (smoke test) ────────────────────────────────────────────────────────


def test_health() -> None:
    mock_redis = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)

    mock_session = AsyncMock()
    mock_session.execute = AsyncMock()

    mock_session_ctx = AsyncMock()
    mock_session_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_ctx.__aexit__ = AsyncMock(return_value=False)

    with (
        patch("routers.health.get_redis", return_value=mock_redis),
        patch("routers.health.AsyncSessionLocal", return_value=mock_session_ctx),
        patch("routers.health._check_workers", new_callable=AsyncMock, return_value=[]),
    ):
        response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "0.1.0"
    assert data["db"]["status"] == "ok"
    assert data["redis"]["status"] == "ok"


# ── Protected route without token → 401 ───────────────────────────────────────


def test_protected_without_token() -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


# ── Protected route with invalid token → 401 ──────────────────────────────────


def test_protected_with_bad_token() -> None:
    from supabase import AuthApiError

    # Patch where it is looked up: routers.auth binds get_supabase at import time,
    # so patching utils.supabase would leave that binding pointing at the real client.
    with patch("routers.auth.get_supabase") as mock_get:
        mock_sb = MagicMock()
        mock_sb.auth.get_user.side_effect = AuthApiError("invalid token", 401, "invalid_token")
        mock_get.return_value = mock_sb

        response = client.get("/api/auth/me", headers={"Authorization": "Bearer bad-token"})
        assert response.status_code == 401

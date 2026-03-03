"""Tests for the score service — heuristic scoring against active users."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_JOB_ID_1 = uuid.UUID("aaaa1111-1111-1111-1111-111111111111")
_JOB_ID_2 = uuid.UUID("aaaa2222-2222-2222-2222-222222222222")


# ── score_new_jobs_for_users ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_score_returns_early_when_no_users() -> None:
    """Should return early when no active users found."""
    from services.score_service import score_new_jobs_for_users

    mock_db = AsyncMock()
    # _load_active_users returns empty list
    mock_result = MagicMock()
    mock_result.unique.return_value.scalars.return_value.all.return_value = []
    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await score_new_jobs_for_users(mock_db, [_JOB_ID_1])
    assert result["users_checked"] == 0
    assert result["scores_upserted"] == 0


@pytest.mark.asyncio
async def test_score_returns_early_when_no_jobs() -> None:
    """Should return early when no active jobs match the provided IDs."""
    from services.score_service import score_new_jobs_for_users

    mock_user = MagicMock()
    mock_user.id = _USER_ID
    mock_user.profile = MagicMock()
    mock_user.auto_apply_config = MagicMock()

    mock_db = AsyncMock()
    # First call: _load_active_users returns one user
    users_result = MagicMock()
    users_result.unique.return_value.scalars.return_value.all.return_value = [mock_user]
    # Second call: jobs query returns empty
    jobs_result = MagicMock()
    jobs_result.scalars.return_value.all.return_value = []

    mock_db.execute = AsyncMock(side_effect=[users_result, jobs_result])

    result = await score_new_jobs_for_users(mock_db, [_JOB_ID_1])
    assert result["users_checked"] == 1
    assert result["scores_upserted"] == 0
    assert result["jobs_available"] == 0


@pytest.mark.asyncio
async def test_score_computes_and_upserts() -> None:
    """Should compute heuristic scores and upsert rows above threshold."""
    from services.score_service import score_new_jobs_for_users

    # Set up user with profile and config
    mock_skill = MagicMock()
    mock_skill.name = "Python"

    mock_profile = MagicMock()
    mock_profile.skills = [mock_skill]
    mock_profile.location = "Toronto"

    mock_config = MagicMock()
    mock_config.target_titles = ["Backend Engineer"]
    mock_config.target_locations = ["Toronto"]

    mock_user = MagicMock()
    mock_user.id = _USER_ID
    mock_user.profile = mock_profile
    mock_user.auto_apply_config = mock_config

    # Set up job
    mock_job = MagicMock()
    mock_job.id = _JOB_ID_1
    mock_job.title = "Backend Engineer"
    mock_job.description = "Looking for a Python developer"
    mock_job.location = "Toronto, ON"
    mock_job.location_type = "onsite"

    mock_db = AsyncMock()
    # _load_active_users
    users_result = MagicMock()
    users_result.unique.return_value.scalars.return_value.all.return_value = [mock_user]
    # jobs query
    jobs_result = MagicMock()
    jobs_result.scalars.return_value.all.return_value = [mock_job]
    # un-enriched check
    unenriched_result = MagicMock()
    unenriched_result.scalars.return_value.all.return_value = [_JOB_ID_1]

    mock_db.execute = AsyncMock(side_effect=[users_result, jobs_result, MagicMock(), unenriched_result])

    with patch("services.score_service.push_enrich_task", new_callable=AsyncMock):
        result = await score_new_jobs_for_users(mock_db, [_JOB_ID_1])

    assert result["users_checked"] == 1
    assert result["jobs_scored"] == 1
    assert result["scores_upserted"] >= 1

"""Tests for the heuristic scoring service — per-user scoring."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_JOB_ID_1 = uuid.UUID("aaaa1111-1111-1111-1111-111111111111")
_JOB_ID_2 = uuid.UUID("aaaa2222-2222-2222-2222-222222222222")


# ── score_new_jobs_for_user ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_score_returns_early_when_no_user() -> None:
    """Should return early when the user is not found."""
    from workers.services.heuristic_scorer import score_new_jobs_for_user

    mock_db = AsyncMock()

    with patch(
        "workers.services.heuristic_scorer.load_user_with_profile",
        new_callable=AsyncMock,
        return_value=None,
    ):
        result = await score_new_jobs_for_user(mock_db, _USER_ID)
    assert result["jobs_scored"] == 0
    assert result["scores_upserted"] == 0


@pytest.mark.asyncio
async def test_score_returns_early_when_no_jobs() -> None:
    """Should return early when no candidate jobs match user preferences."""
    from workers.services.heuristic_scorer import score_new_jobs_for_user

    mock_user = MagicMock()
    mock_user.id = _USER_ID
    mock_user.profile = MagicMock()
    mock_user.auto_apply_config = MagicMock()

    mock_db = AsyncMock()

    with (
        patch(
            "workers.services.heuristic_scorer.load_user_with_profile",
            new_callable=AsyncMock,
            return_value=mock_user,
        ),
        patch(
            "workers.services.heuristic_scorer.filter_candidate_jobs",
            new_callable=AsyncMock,
            return_value=[],
        ),
    ):
        result = await score_new_jobs_for_user(mock_db, _USER_ID)
    assert result["jobs_filtered"] == 0
    assert result["scores_upserted"] == 0


@pytest.mark.asyncio
async def test_score_computes_and_upserts() -> None:
    """Should compute heuristic scores and upsert rows above threshold."""
    from workers.services.heuristic_scorer import score_new_jobs_for_user

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

    with (
        patch(
            "workers.services.heuristic_scorer.load_user_with_profile",
            new_callable=AsyncMock,
            return_value=mock_user,
        ),
        patch(
            "workers.services.heuristic_scorer.filter_candidate_jobs",
            new_callable=AsyncMock,
            return_value=[mock_job],
        ),
        patch(
            "workers.services.heuristic_scorer.get_unscored_job_ids",
            new_callable=AsyncMock,
            return_value=[_JOB_ID_1],
        ),
    ):
        result = await score_new_jobs_for_user(mock_db, _USER_ID)

    assert result["jobs_filtered"] == 1
    assert result["jobs_scored"] == 1
    assert result["scores_upserted"] >= 1

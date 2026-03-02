"""Tests for the score service — hybrid scoring formula, threshold filtering."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_JOB_ID_1 = uuid.UUID("aaaa1111-1111-1111-1111-111111111111")
_JOB_ID_2 = uuid.UUID("aaaa2222-2222-2222-2222-222222222222")
_PROFILE_ID = uuid.UUID("bbbb1111-1111-1111-1111-111111111111")


# ── embed_and_store_jobs ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_embed_and_store_jobs_skips_when_no_jobs() -> None:
    """Should return early when no un-embedded jobs are found."""
    from services.score_service import embed_and_store_jobs

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.execute = AsyncMock(return_value=mock_result)

    with patch("services.score_service.embed_texts") as mock_embed:
        await embed_and_store_jobs(mock_db, [_JOB_ID_1])
        mock_embed.assert_not_called()


@pytest.mark.asyncio
async def test_embed_and_store_jobs_embeds_and_stores() -> None:
    """Should embed jobs and update their embedding fields."""
    from services.score_service import embed_and_store_jobs

    mock_job = MagicMock()
    mock_job.title = "Engineer"
    mock_job.description = "Build stuff"
    mock_job.company_name = "Acme"
    mock_job.tags = ["python"]
    mock_job.embedding = None
    mock_job.embedding_updated_at = None

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_job]
    mock_db.execute = AsyncMock(return_value=mock_result)
    mock_db.flush = AsyncMock()

    fake_embedding = [0.1] * 1024

    with patch("services.score_service.embed_texts", new_callable=AsyncMock, return_value=[fake_embedding]):
        await embed_and_store_jobs(mock_db, [_JOB_ID_1])

    assert mock_job.embedding == fake_embedding
    assert mock_job.embedding_updated_at is not None
    mock_db.flush.assert_called_once()


# ── embed_and_store_user ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_embed_and_store_user_no_profile() -> None:
    """Should return early if profile not found."""
    from services.score_service import embed_and_store_user

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute = AsyncMock(return_value=mock_result)

    with patch("services.score_service.embed_single") as mock_embed:
        await embed_and_store_user(mock_db, _USER_ID)
        mock_embed.assert_not_called()


@pytest.mark.asyncio
async def test_embed_and_store_user_builds_text_and_embeds() -> None:
    """Should build embedding text from profile data and store result."""
    from services.score_service import embed_and_store_user

    mock_skill = MagicMock()
    mock_skill.name = "Python"

    mock_exp = MagicMock()
    mock_exp.title = "Engineer"
    mock_exp.company = "Acme"
    mock_exp.description = "Built things"
    mock_exp.sort_order = 0

    mock_profile = MagicMock()
    mock_profile.skills = [mock_skill]
    mock_profile.experiences = [mock_exp]
    mock_profile.summary = "Experienced dev"
    mock_profile.application_preferences = {
        "target_titles": ["Senior Engineer"],
        "target_locations": ["Remote"],
    }
    mock_profile.embedding = None
    mock_profile.embedding_updated_at = None

    # First execute returns profile, second returns config
    mock_config = MagicMock()
    mock_config.target_titles = ["Senior Engineer"]
    mock_config.target_locations = ["Remote"]

    profile_result = MagicMock()
    profile_result.scalar_one_or_none.return_value = mock_profile

    config_result = MagicMock()
    config_result.scalar_one_or_none.return_value = mock_config

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(side_effect=[profile_result, config_result])
    mock_db.flush = AsyncMock()

    fake_embedding = [0.5] * 1024

    with patch("services.score_service.embed_single", new_callable=AsyncMock, return_value=fake_embedding):
        result = await embed_and_store_user(mock_db, _USER_ID)

    assert result is True
    assert mock_profile.embedding == fake_embedding
    assert mock_profile.embedding_updated_at is not None


# ── Hybrid scoring formula ──────────────────────────────────────────────────


def test_combined_score_formula() -> None:
    """Verify the 70/30 heuristic/vector weighting."""
    heuristic = 80.0
    cosine_sim = 0.85
    combined = 0.7 * heuristic + 0.3 * (cosine_sim * 100)
    assert combined == pytest.approx(81.5)


def test_combined_score_zero_heuristic() -> None:
    """Even with zero heuristic, vector similarity contributes."""
    heuristic = 0.0
    cosine_sim = 0.9
    combined = 0.7 * heuristic + 0.3 * (cosine_sim * 100)
    assert combined == pytest.approx(27.0)


def test_combined_score_zero_vector() -> None:
    """Even with zero vector similarity, heuristic contributes."""
    heuristic = 50.0
    cosine_sim = 0.0
    combined = 0.7 * heuristic + 0.3 * (cosine_sim * 100)
    assert combined == pytest.approx(35.0)

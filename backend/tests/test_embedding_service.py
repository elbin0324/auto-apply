"""Tests for the embedding service — text builders, batching, truncation."""

import pytest

from services.embedding_service import (
    MAX_TEXT_CHARS,
    build_job_embedding_text,
    build_user_embedding_text,
)


# ── build_job_embedding_text ────────────────────────────────────────────────


def test_build_job_text_all_fields() -> None:
    text = build_job_embedding_text(
        title="Software Engineer",
        description="Build cool stuff",
        company="Acme Corp",
        tags=["python", "fastapi"],
    )
    assert "Job Title: Software Engineer" in text
    assert "Company: Acme Corp" in text
    assert "Description: Build cool stuff" in text
    assert "Tags: python, fastapi" in text


def test_build_job_text_minimal() -> None:
    text = build_job_embedding_text(
        title="Designer",
        description=None,
        company=None,
        tags=None,
    )
    assert text == "Job Title: Designer"


def test_build_job_text_empty_tags() -> None:
    text = build_job_embedding_text(
        title="PM",
        description=None,
        company=None,
        tags=[],
    )
    assert "Tags" not in text


# ── build_user_embedding_text ───────────────────────────────────────────────


def test_build_user_text_all_fields() -> None:
    text = build_user_embedding_text(
        skills=["Python", "React"],
        target_titles=["Senior Engineer", "Staff Engineer"],
        summary="10 years experience in web dev",
        experiences_text="Senior Dev at Acme; Lead at Widgets",
        target_locations=["Remote", "NYC"],
    )
    assert "Target Roles: Senior Engineer, Staff Engineer" in text
    assert "Skills: Python, React" in text
    assert "Professional Summary: 10 years experience" in text
    assert "Experience: Senior Dev at Acme" in text
    assert "Preferred Locations: Remote, NYC" in text


def test_build_user_text_empty() -> None:
    text = build_user_embedding_text(
        skills=[],
        target_titles=[],
        summary=None,
        experiences_text=None,
        target_locations=None,
    )
    assert text == ""


def test_build_user_text_partial() -> None:
    text = build_user_embedding_text(
        skills=["Go"],
        target_titles=[],
        summary=None,
        experiences_text=None,
        target_locations=None,
    )
    assert text == "Skills: Go"


# ── embed_texts batching ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_embed_texts_empty_input() -> None:
    from services.embedding_service import embed_texts

    # Empty input should return empty list without calling API
    result = await embed_texts([])
    assert result == []


@pytest.mark.asyncio
async def test_embed_texts_truncates_long_text() -> None:
    """Verify texts over MAX_TEXT_CHARS are truncated before sending to API."""
    from unittest.mock import AsyncMock, patch, MagicMock

    from services.embedding_service import embed_texts

    long_text = "x" * (MAX_TEXT_CHARS + 1000)

    mock_result = MagicMock()
    mock_result.embeddings = [[0.1] * 1024]

    mock_client = AsyncMock()
    mock_client.embed = AsyncMock(return_value=mock_result)

    with patch("services.embedding_service._get_client", return_value=mock_client):
        result = await embed_texts([long_text], input_type="document")

    # Should have been called with truncated text
    call_args = mock_client.embed.call_args
    batch = call_args[0][0]
    assert len(batch[0]) == MAX_TEXT_CHARS
    assert len(result) == 1


@pytest.mark.asyncio
async def test_embed_texts_replaces_empty_with_placeholder() -> None:
    """Empty/whitespace texts should be replaced with 'empty' placeholder."""
    from unittest.mock import AsyncMock, patch, MagicMock

    from services.embedding_service import embed_texts

    mock_result = MagicMock()
    mock_result.embeddings = [[0.1] * 1024, [0.2] * 1024]

    mock_client = AsyncMock()
    mock_client.embed = AsyncMock(return_value=mock_result)

    with patch("services.embedding_service._get_client", return_value=mock_client):
        result = await embed_texts(["valid text", "   "], input_type="document")

    call_args = mock_client.embed.call_args
    batch = call_args[0][0]
    assert batch[0] == "valid text"
    assert batch[1] == "empty"
    assert len(result) == 2

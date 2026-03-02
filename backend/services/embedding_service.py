"""Voyage AI embedding service — batch and single text embedding.

Uses asymmetric embeddings:
- input_type="document" for jobs (content being indexed)
- input_type="query" for user profiles (search queries against jobs)
"""

import logging
from typing import Sequence

import voyageai

from config import get_settings

logger = logging.getLogger(__name__)

_client: voyageai.AsyncClient | None = None

MAX_TEXT_CHARS = 8000  # ~2000 tokens, keeps batches within Voyage's 120K token limit


def _get_client() -> voyageai.AsyncClient:
    global _client  # noqa: PLW0603
    if _client is None:
        settings = get_settings()
        _client = voyageai.AsyncClient(api_key=settings.voyage_api_key)
    return _client


async def embed_texts(
    texts: Sequence[str],
    input_type: str = "document",
) -> list[list[float]]:
    """Batch-embed texts via Voyage AI.

    Args:
        texts: List of strings to embed.
        input_type: "document" for jobs, "query" for user profiles.

    Returns:
        List of embedding vectors (each 1024 floats).
    """
    if not texts:
        return []

    settings = get_settings()
    client = _get_client()
    all_embeddings: list[list[float]] = []

    batch_size = settings.voyage_batch_size
    for i in range(0, len(texts), batch_size):
        batch = list(texts[i : i + batch_size])
        # Truncate individual texts to stay within token limits
        batch = [t[:MAX_TEXT_CHARS] if len(t) > MAX_TEXT_CHARS else t for t in batch]
        # Filter out empty texts
        batch = [t if t.strip() else "empty" for t in batch]

        result = await client.embed(
            batch,
            model=settings.voyage_model,
            input_type=input_type,
        )
        all_embeddings.extend(result.embeddings)

    return all_embeddings


async def embed_single(text: str, input_type: str = "document") -> list[float]:
    """Embed a single text. Convenience wrapper."""
    results = await embed_texts([text], input_type=input_type)
    return results[0]


def build_job_embedding_text(
    title: str,
    description: str | None,
    company: str | None,
    tags: list | None,
) -> str:
    """Build the text to embed for a job listing."""
    parts = [f"Job Title: {title}"]
    if company:
        parts.append(f"Company: {company}")
    if description:
        parts.append(f"Description: {description}")
    if tags:
        parts.append(f"Tags: {', '.join(str(t) for t in tags)}")
    return "\n\n".join(parts)


def build_user_embedding_text(
    skills: list[str],
    target_titles: list[str],
    summary: str | None,
    experiences_text: str | None,
    target_locations: list[str] | None,
) -> str:
    """Build the text to embed for a user profile.

    Weighted toward job-seeking intent: target titles first, then skills,
    then experience summary.
    """
    parts = []
    if target_titles:
        parts.append(f"Target Roles: {', '.join(target_titles)}")
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    if summary:
        parts.append(f"Professional Summary: {summary}")
    if experiences_text:
        parts.append(f"Experience: {experiences_text}")
    if target_locations:
        parts.append(f"Preferred Locations: {', '.join(target_locations)}")
    return "\n\n".join(parts) if parts else ""

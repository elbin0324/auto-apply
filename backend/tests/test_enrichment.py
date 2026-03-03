"""Tests for job enrichment schemas, queue service, and enrichment logic."""

import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from schemas.enrichment import (
    EnrichedJobData,
    EnrichJobsTask,
    EnrichmentStats,
    SalaryExtracted,
)


_JOB_ID_1 = uuid.UUID("aaaa1111-1111-1111-1111-111111111111")
_JOB_ID_2 = uuid.UUID("aaaa2222-2222-2222-2222-222222222222")


# ── Schema tests ──────────────────────────────────────────────────────────────


def test_enrich_jobs_task_roundtrip() -> None:
    task = EnrichJobsTask(job_ids=[_JOB_ID_1, _JOB_ID_2])
    data = task.model_dump_json()
    restored = EnrichJobsTask.model_validate_json(data)
    assert len(restored.job_ids) == 2


def test_enriched_job_data_minimal() -> None:
    data = EnrichedJobData(experience_level="senior", employment_type="full_time")
    assert data.experience_level == "senior"
    assert data.required_skills == []
    assert data.salary_mentioned is None


def test_enriched_job_data_full() -> None:
    data = EnrichedJobData(
        experience_level="mid",
        employment_type="full_time",
        years_experience_min=3,
        years_experience_max=5,
        description_clean="A clean description.",
        required_skills=["Python", "FastAPI"],
        preferred_skills=["Docker"],
        education="Bachelor's in CS",
        benefits=["Health", "401k"],
        visa_sponsorship=True,
        salary_mentioned=SalaryExtracted(min=100000, max=150000, currency="USD"),
        key_responsibilities=["Build APIs"],
    )
    assert data.years_experience_min == 3
    assert len(data.required_skills) == 2
    assert data.salary_mentioned.min == 100000


def test_salary_extracted_defaults() -> None:
    s = SalaryExtracted()
    assert s.currency == "USD"
    assert s.type == "annual"
    assert s.min is None


def test_enrichment_stats_defaults() -> None:
    s = EnrichmentStats()
    assert s.jobs_enriched == 0
    assert s.salary_backfills == 0


# ── Queue service tests ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_push_enrich_task() -> None:
    from services.enrich_queue_service import push_enrich_task

    task = EnrichJobsTask(job_ids=[_JOB_ID_1])

    mock_redis = AsyncMock()
    mock_redis.rpush = AsyncMock()

    with patch(
        "services.enrich_queue_service.get_redis",
        return_value=mock_redis,
    ):
        await push_enrich_task(task)

    mock_redis.rpush.assert_called_once()


@pytest.mark.asyncio
async def test_pop_enrich_task_empty() -> None:
    from services.enrich_queue_service import pop_enrich_task

    mock_redis = AsyncMock()
    mock_redis.blpop = AsyncMock(return_value=None)

    with patch(
        "services.enrich_queue_service.get_redis",
        return_value=mock_redis,
    ):
        result = await pop_enrich_task()

    assert result is None


@pytest.mark.asyncio
async def test_pop_enrich_task_returns_task() -> None:
    from services.enrich_queue_service import pop_enrich_task

    task = EnrichJobsTask(job_ids=[_JOB_ID_1])

    mock_redis = AsyncMock()
    mock_redis.blpop = AsyncMock(return_value=("enrich:jobs", task.model_dump_json()))

    with patch(
        "services.enrich_queue_service.get_redis",
        return_value=mock_redis,
    ):
        result = await pop_enrich_task()

    assert result is not None
    envelope, popped_task = result
    assert popped_task.job_ids == [_JOB_ID_1]


# ── Enrichment service tests ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_enrich_single_job_parses_json() -> None:
    from services.job_enrichment import enrich_single_job

    mock_response = json.dumps({
        "experience_level": "senior",
        "employment_type": "full_time",
        "years_experience_min": 5,
        "years_experience_max": None,
        "description_clean": "Clean desc",
        "required_skills": ["Python"],
        "preferred_skills": [],
        "education": None,
        "benefits": [],
        "visa_sponsorship": None,
        "salary_mentioned": None,
        "key_responsibilities": ["Build things"],
    })

    with patch(
        "services.job_enrichment.chat_completion",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        result = await enrich_single_job("Raw desc text", "Senior Engineer")

    assert result is not None
    assert result.experience_level == "senior"
    assert result.years_experience_min == 5
    assert result.required_skills == ["Python"]


@pytest.mark.asyncio
async def test_enrich_single_job_strips_markdown_fences() -> None:
    from services.job_enrichment import enrich_single_job

    inner_json = json.dumps({
        "experience_level": "mid",
        "employment_type": "full_time",
        "years_experience_min": None,
        "years_experience_max": None,
        "description_clean": "Clean",
        "required_skills": [],
        "preferred_skills": [],
        "education": None,
        "benefits": [],
        "visa_sponsorship": None,
        "salary_mentioned": None,
        "key_responsibilities": [],
    })
    mock_response = f"```json\n{inner_json}\n```"

    with patch(
        "services.job_enrichment.chat_completion",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        result = await enrich_single_job("Raw desc", "Engineer")

    assert result is not None
    assert result.experience_level == "mid"


@pytest.mark.asyncio
async def test_enrich_single_job_returns_none_on_bad_json() -> None:
    from services.job_enrichment import enrich_single_job

    with patch(
        "services.job_enrichment.chat_completion",
        new_callable=AsyncMock,
        return_value="This is not valid JSON at all",
    ):
        result = await enrich_single_job("Raw desc", "Engineer")

    assert result is None


@pytest.mark.asyncio
async def test_enrich_single_job_returns_none_on_exception() -> None:
    from services.job_enrichment import enrich_single_job

    with patch(
        "services.job_enrichment.chat_completion",
        new_callable=AsyncMock,
        side_effect=RuntimeError("API error"),
    ):
        result = await enrich_single_job("Raw desc", "Engineer")

    assert result is None


def test_build_requirements_jsonb_full() -> None:
    from services.job_enrichment import _build_requirements_jsonb

    enriched = EnrichedJobData(
        required_skills=["Python", "FastAPI"],
        preferred_skills=["Docker"],
        education="BS in CS",
        benefits=["Health"],
        visa_sponsorship=True,
        salary_mentioned=SalaryExtracted(min=100000, max=150000),
        key_responsibilities=["Build APIs"],
    )
    result = _build_requirements_jsonb(enriched)

    assert result["required_skills"] == ["Python", "FastAPI"]
    assert result["visa_sponsorship"] is True
    assert result["salary_mentioned"]["min"] == 100000
    assert result["key_responsibilities"] == ["Build APIs"]


def test_build_requirements_jsonb_empty() -> None:
    from services.job_enrichment import _build_requirements_jsonb

    enriched = EnrichedJobData()
    result = _build_requirements_jsonb(enriched)
    assert result == {}


def test_build_requirements_jsonb_partial() -> None:
    from services.job_enrichment import _build_requirements_jsonb

    enriched = EnrichedJobData(
        required_skills=["React"],
        visa_sponsorship=False,
    )
    result = _build_requirements_jsonb(enriched)
    assert result["required_skills"] == ["React"]
    assert result["visa_sponsorship"] is False
    assert "preferred_skills" not in result
    assert "education" not in result

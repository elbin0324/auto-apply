"""Tests for the LLM-based job scoring pipeline."""

import json
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from schemas.scoring import LLMScoreFactors, LLMScoreResult
from workers.services.llm_scorer import (
    _build_jobs_batch_prompt,
    _build_user_context,
    _score_batch_llm,
    _score_jobs_for_user,
)

_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_JOB_ID_1 = uuid.UUID("22222222-2222-2222-2222-222222222221")
_JOB_ID_2 = uuid.UUID("22222222-2222-2222-2222-222222222222")
_JOB_ID_3 = uuid.UUID("22222222-2222-2222-2222-222222222223")


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------


def _mock_skill(name: str) -> SimpleNamespace:
    return SimpleNamespace(name=name, category="technical", proficiency="intermediate")


def _mock_experience(title: str, company: str, **kw: object) -> SimpleNamespace:
    defaults = {
        "title": title,
        "company": company,
        "description": None,
        "location": None,
        "start_date": None,
        "end_date": None,
        "sort_order": 0,
    }
    defaults.update(kw)
    return SimpleNamespace(**defaults)


def _mock_education(institution: str, **kw: object) -> SimpleNamespace:
    defaults = {
        "institution": institution,
        "degree": "BSc",
        "field_of_study": "Computer Science",
        "sort_order": 0,
    }
    defaults.update(kw)
    return SimpleNamespace(**defaults)


def _mock_profile(**kw: object) -> SimpleNamespace:
    defaults = {
        "full_name": "Jane Doe",
        "location": "Toronto, ON",
        "summary": "Senior backend developer with 5 years of Python experience.",
        "skills": [
            _mock_skill("Python"),
            _mock_skill("FastAPI"),
            _mock_skill("PostgreSQL"),
            _mock_skill("Redis"),
        ],
        "experiences": [
            _mock_experience("Backend Developer", "Acme Corp", sort_order=0),
        ],
        "educations": [
            _mock_education("University of Toronto"),
        ],
    }
    defaults.update(kw)
    return SimpleNamespace(**defaults)


def _mock_config(**kw: object) -> SimpleNamespace:
    defaults = {
        "target_titles": ["Backend Developer", "Software Engineer"],
        "target_locations": ["Toronto", "Remote"],
        "location_type_pref": ["remote", "hybrid"],
        "experience_level": "mid",
    }
    defaults.update(kw)
    return SimpleNamespace(**defaults)


def _mock_user(**kw: object) -> SimpleNamespace:
    defaults = {
        "id": _USER_ID,
        "profile": _mock_profile(),
        "auto_apply_config": _mock_config(),
    }
    defaults.update(kw)
    return SimpleNamespace(**defaults)


def _mock_job(job_id: uuid.UUID = _JOB_ID_1, **kw: object) -> SimpleNamespace:
    defaults = {
        "id": job_id,
        "title": "Senior Python Developer",
        "company": "Tech Corp",
        "location": "Remote",
        "location_type": "remote",
        "salary_min": 120000,
        "salary_max": 160000,
        "description": "We are looking for a Senior Python Developer to join our team. "
        "Requirements: Python, FastAPI, PostgreSQL, Redis, Docker, Kubernetes. "
        "Nice to have: Go, GraphQL.",
        "is_active": True,
        "ai_enrichment": None,
        "experience_level": None,
        "employment_type": None,
        "years_experience_min": None,
        "years_experience_max": None,
        "posted_at": None,
    }
    defaults.update(kw)
    return SimpleNamespace(**defaults)


def _llm_response_json(scores: list[dict]) -> str:
    """Build a mock LLM JSON response."""
    return json.dumps(scores)


# ---------------------------------------------------------------------------
# Tests: _build_user_context
# ---------------------------------------------------------------------------


class TestBuildUserContext:
    def test_includes_basic_fields(self) -> None:
        profile = _mock_profile()
        config = _mock_config()
        ctx = _build_user_context(profile, config)

        assert "Jane Doe" in ctx
        assert "Toronto, ON" in ctx
        assert "Python" in ctx
        assert "FastAPI" in ctx

    def test_includes_experience(self) -> None:
        profile = _mock_profile()
        ctx = _build_user_context(profile, None)

        assert "Backend Developer" in ctx
        assert "Acme Corp" in ctx

    def test_includes_education(self) -> None:
        profile = _mock_profile()
        ctx = _build_user_context(profile, None)

        assert "University of Toronto" in ctx
        assert "BSc" in ctx

    def test_includes_config_preferences(self) -> None:
        profile = _mock_profile()
        config = _mock_config()
        ctx = _build_user_context(profile, config)

        assert "Backend Developer" in ctx
        assert "Software Engineer" in ctx
        assert "Toronto" in ctx
        assert "remote" in ctx

    def test_handles_none_config(self) -> None:
        profile = _mock_profile()
        ctx = _build_user_context(profile, None)

        assert "CANDIDATE PROFILE:" in ctx
        assert "Jane Doe" in ctx

    def test_handles_empty_skills(self) -> None:
        profile = _mock_profile(skills=[])
        ctx = _build_user_context(profile, None)

        assert "Skills:" not in ctx

    def test_truncates_summary(self) -> None:
        long_summary = "x" * 500
        profile = _mock_profile(summary=long_summary)
        ctx = _build_user_context(profile, None)

        # Summary should be truncated to 300 chars
        assert len(long_summary) > 300
        assert "x" * 300 in ctx
        assert "x" * 301 not in ctx


# ---------------------------------------------------------------------------
# Tests: _build_jobs_batch_prompt
# ---------------------------------------------------------------------------


class TestBuildJobsBatchPrompt:
    def test_includes_all_jobs(self) -> None:
        jobs = [_mock_job(_JOB_ID_1), _mock_job(_JOB_ID_2, title="Frontend Dev")]
        prompt = _build_jobs_batch_prompt(jobs)

        assert "JOB 0" in prompt
        assert "JOB 1" in prompt
        assert "Senior Python Developer" in prompt
        assert "Frontend Dev" in prompt

    def test_truncates_long_descriptions(self) -> None:
        long_desc = "x" * 1500
        job = _mock_job(description=long_desc)
        prompt = _build_jobs_batch_prompt([job])

        # Description should be truncated to 800 chars
        assert "x" * 800 in prompt
        assert "x" * 801 not in prompt

    def test_handles_null_fields(self) -> None:
        job = _mock_job(
            company=None,
            location=None,
            location_type=None,
            salary_min=None,
            salary_max=None,
        )
        prompt = _build_jobs_batch_prompt([job])

        assert "Company:" not in prompt
        assert "Location:" not in prompt
        assert "Salary:" not in prompt

    def test_includes_salary_when_present(self) -> None:
        job = _mock_job(salary_min=100000, salary_max=150000)
        prompt = _build_jobs_batch_prompt([job])

        assert "Salary:" in prompt
        assert "100000" in prompt


# ---------------------------------------------------------------------------
# Tests: _score_batch_llm
# ---------------------------------------------------------------------------


class TestScoreBatchLLM:
    @pytest.mark.asyncio
    async def test_parses_valid_response(self) -> None:
        provider = AsyncMock()
        provider.complete.return_value = _llm_response_json(
            [
                {
                    "job_index": 0,
                    "score": 82,
                    "matched_skills": ["Python", "FastAPI"],
                    "missing_skills": ["Kubernetes"],
                    "preferred_skills": ["Go"],
                    "reasoning": "Strong backend match",
                }
            ]
        )

        jobs = [_mock_job()]
        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="claude-haiku-4-5-20251001",
                scoring_max_tokens=1024,
            )
            results, latency = await _score_batch_llm(
                provider, "user context", jobs, batch_index=0
            )

        assert len(results) == 1
        assert results[0].score == 82
        assert results[0].matched_skills == ["Python", "FastAPI"]
        assert results[0].missing_skills == ["Kubernetes"]
        assert latency >= 0

    @pytest.mark.asyncio
    async def test_handles_markdown_wrapped_json(self) -> None:
        provider = AsyncMock()
        inner = _llm_response_json(
            [{"job_index": 0, "score": 70, "matched_skills": [], "missing_skills": []}]
        )
        provider.complete.return_value = f"```json\n{inner}\n```"

        jobs = [_mock_job()]
        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
            )
            results, _ = await _score_batch_llm(
                provider, "ctx", jobs, batch_index=0
            )

        assert len(results) == 1
        assert results[0].score == 70

    @pytest.mark.asyncio
    async def test_returns_empty_on_bad_json(self) -> None:
        provider = AsyncMock()
        provider.complete.return_value = "This is not JSON at all"

        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
            )
            results, _ = await _score_batch_llm(
                provider, "ctx", [_mock_job()], batch_index=0
            )

        assert results == []

    @pytest.mark.asyncio
    async def test_returns_empty_on_provider_error(self) -> None:
        provider = AsyncMock()
        provider.complete.side_effect = RuntimeError("Connection failed")

        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
            )
            results, _ = await _score_batch_llm(
                provider, "ctx", [_mock_job()], batch_index=0
            )

        assert results == []

    @pytest.mark.asyncio
    async def test_handles_multiple_jobs_in_batch(self) -> None:
        provider = AsyncMock()
        provider.complete.return_value = _llm_response_json(
            [
                {"job_index": 0, "score": 85, "matched_skills": ["Python"]},
                {"job_index": 1, "score": 45, "matched_skills": ["SQL"]},
            ]
        )

        jobs = [_mock_job(_JOB_ID_1), _mock_job(_JOB_ID_2, title="Data Analyst")]
        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
            )
            results, _ = await _score_batch_llm(
                provider, "ctx", jobs, batch_index=0
            )

        assert len(results) == 2
        assert results[0].score == 85
        assert results[1].score == 45


# ---------------------------------------------------------------------------
# Tests: _score_jobs_for_user
# ---------------------------------------------------------------------------


class TestScoreJobsForUser:
    @pytest.mark.asyncio
    async def test_returns_score_rows_for_matching_jobs(self) -> None:
        provider = AsyncMock()
        provider.complete.return_value = _llm_response_json(
            [
                {
                    "job_index": 0,
                    "score": 78,
                    "matched_skills": ["Python", "FastAPI"],
                    "missing_skills": ["Docker"],
                    "preferred_skills": [],
                    "reasoning": "Good match",
                }
            ]
        )

        user = _mock_user()
        jobs = [_mock_job()]

        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="claude-haiku-4-5-20251001",
                scoring_max_tokens=1024,
                scoring_batch_size=5,
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(provider, user, jobs)

        assert len(rows) == 1
        assert rows[0]["user_id"] == _USER_ID
        assert rows[0]["job_id"] == _JOB_ID_1
        assert rows[0]["score"] == 78
        assert rows[0]["factors"]["combined_method"] == "llm"
        assert rows[0]["factors"]["matched_skills"] == ["Python", "FastAPI"]

    @pytest.mark.asyncio
    async def test_filters_below_threshold(self) -> None:
        provider = AsyncMock()
        provider.complete.return_value = _llm_response_json(
            [{"job_index": 0, "score": 5, "matched_skills": []}]
        )

        user = _mock_user()
        jobs = [_mock_job()]

        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=5,
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(provider, user, jobs)

        assert len(rows) == 0

    @pytest.mark.asyncio
    async def test_skips_user_without_profile(self) -> None:
        provider = AsyncMock()
        user = _mock_user(profile=None)
        rows = await _score_jobs_for_user(provider, user, [_mock_job()])
        assert rows == []

    @pytest.mark.asyncio
    async def test_clamps_score_to_0_100(self) -> None:
        provider = AsyncMock()
        provider.complete.return_value = _llm_response_json(
            [{"job_index": 0, "score": 150, "matched_skills": ["Python"]}]
        )

        user = _mock_user()
        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=5,
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(provider, user, [_mock_job()])

        assert len(rows) == 1
        assert rows[0]["score"] == 100.0

    @pytest.mark.asyncio
    async def test_batches_jobs_correctly(self) -> None:
        """With batch_size=2 and 3 jobs, should make 2 LLM calls."""
        call_count = 0

        async def mock_complete(messages, **kwargs):
            nonlocal call_count
            call_count += 1
            # Determine how many jobs in this batch from the prompt
            content = messages[0]["content"]
            job_indices = [
                i for i in range(3) if f"JOB {i}" in content
            ]
            return _llm_response_json(
                [{"job_index": i, "score": 60, "matched_skills": []} for i in range(len(job_indices))]
            )

        provider = AsyncMock()
        provider.complete.side_effect = mock_complete

        user = _mock_user()
        jobs = [
            _mock_job(_JOB_ID_1, title="Job A"),
            _mock_job(_JOB_ID_2, title="Job B"),
            _mock_job(_JOB_ID_3, title="Job C"),
        ]

        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=2,
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(provider, user, jobs)

        # 3 jobs with batch_size=2 → 2 batches
        assert call_count == 2
        assert len(rows) == 3

    @pytest.mark.asyncio
    async def test_skips_out_of_range_job_index(self) -> None:
        provider = AsyncMock()
        provider.complete.return_value = _llm_response_json(
            [
                {"job_index": 0, "score": 75, "matched_skills": ["Python"]},
                {"job_index": 5, "score": 90, "matched_skills": ["Go"]},  # out of range
            ]
        )

        user = _mock_user()
        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=5,
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(provider, user, [_mock_job()])

        # Only job_index=0 is valid
        assert len(rows) == 1
        assert rows[0]["score"] == 75


# ---------------------------------------------------------------------------
# Tests: Pydantic schemas
# ---------------------------------------------------------------------------


class TestSchemas:
    def test_llm_score_result_validation(self) -> None:
        result = LLMScoreResult(
            job_index=0,
            score=85.5,
            matched_skills=["Python"],
            missing_skills=["Go"],
            preferred_skills=[],
            reasoning="Good match",
        )
        assert result.score == 85.5
        assert result.matched_skills == ["Python"]

    def test_llm_score_result_accepts_out_of_range(self) -> None:
        # LLM may return scores outside 0-100; clamping happens downstream
        result = LLMScoreResult(job_index=0, score=150)
        assert result.score == 150

    def test_llm_score_factors_serializes(self) -> None:
        factors = LLMScoreFactors(
            model="claude-haiku-4-5-20251001",
            matched_skills=["Python"],
            missing_skills=["Go"],
            reasoning="Test",
        )
        data = factors.model_dump()
        assert data["combined_method"] == "llm"
        assert data["matched_skills"] == ["Python"]
        assert data["model"] == "claude-haiku-4-5-20251001"


# ---------------------------------------------------------------------------
# Tests: scoring cap and recency ordering
# ---------------------------------------------------------------------------


class TestScoreNewJobsLLMCap:
    """Tests for the SCORING_MAX_JOBS_PER_TASK cap and recency ordering."""

    @pytest.mark.asyncio
    async def test_caps_jobs_to_max_per_task(self) -> None:
        """When more unscored jobs than the cap, only the cap number are scored."""
        from datetime import timedelta

        from workers.services.llm_scorer import SCORING_MAX_JOBS_PER_TASK, score_new_jobs_llm

        mock_user = _mock_user()

        base_time = datetime(2026, 3, 1, tzinfo=timezone.utc)
        num_jobs = SCORING_MAX_JOBS_PER_TASK + 50
        all_jobs = []
        for i in range(num_jobs):
            job = _mock_job(
                uuid.uuid4(),
                title=f"Job {i}",
                posted_at=base_time + timedelta(days=i),
            )
            all_jobs.append(job)

        all_job_ids = [j.id for j in all_jobs]
        mock_db = AsyncMock()

        with (
            patch(
                "workers.services.llm_scorer.load_user_with_profile",
                new_callable=AsyncMock,
                return_value=mock_user,
            ),
            patch(
                "workers.services.llm_scorer.filter_candidate_jobs",
                new_callable=AsyncMock,
                return_value=all_jobs,
            ),
            patch(
                "workers.services.llm_scorer.get_unscored_job_ids",
                new_callable=AsyncMock,
                return_value=all_job_ids,
            ),
            patch(
                "workers.services.llm_scorer._score_jobs_for_user",
                new_callable=AsyncMock,
                return_value=[],
            ) as mock_score,
            patch("workers.services.llm_scorer.get_settings") as mock_settings,
        ):
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=10,
                scoring_concurrency=3,
                scoring_use_llm=True,
                score_min_threshold=15.0,
            )
            provider = AsyncMock()
            await score_new_jobs_llm(mock_db, provider, _USER_ID)

            scored_jobs = mock_score.call_args[0][2]
            assert len(scored_jobs) == SCORING_MAX_JOBS_PER_TASK

    @pytest.mark.asyncio
    async def test_prioritizes_recent_jobs(self) -> None:
        """Most recently posted jobs should be scored first."""
        from datetime import timedelta

        from workers.services.llm_scorer import SCORING_MAX_JOBS_PER_TASK, score_new_jobs_llm

        mock_user = _mock_user()

        base_time = datetime(2026, 1, 1, tzinfo=timezone.utc)
        all_jobs = []
        for i in range(SCORING_MAX_JOBS_PER_TASK + 20):
            job = _mock_job(
                uuid.uuid4(),
                title=f"Job {i}",
                posted_at=base_time + timedelta(days=i),
            )
            all_jobs.append(job)

        all_job_ids = [j.id for j in all_jobs]
        mock_db = AsyncMock()

        with (
            patch(
                "workers.services.llm_scorer.load_user_with_profile",
                new_callable=AsyncMock,
                return_value=mock_user,
            ),
            patch(
                "workers.services.llm_scorer.filter_candidate_jobs",
                new_callable=AsyncMock,
                return_value=all_jobs,
            ),
            patch(
                "workers.services.llm_scorer.get_unscored_job_ids",
                new_callable=AsyncMock,
                return_value=all_job_ids,
            ),
            patch(
                "workers.services.llm_scorer._score_jobs_for_user",
                new_callable=AsyncMock,
                return_value=[],
            ) as mock_score,
            patch("workers.services.llm_scorer.get_settings") as mock_settings,
        ):
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=10,
                scoring_concurrency=3,
                scoring_use_llm=True,
                score_min_threshold=15.0,
            )
            provider = AsyncMock()
            await score_new_jobs_llm(mock_db, provider, _USER_ID)

            scored_jobs = mock_score.call_args[0][2]
            posted_dates = [j.posted_at for j in scored_jobs]
            assert posted_dates == sorted(posted_dates, reverse=True)


# ---------------------------------------------------------------------------
# Tests: partial failure handling
# ---------------------------------------------------------------------------


class TestPartialFailureHandling:
    @pytest.mark.asyncio
    async def test_saves_successful_batches_when_one_fails(self) -> None:
        """If one batch raises an exception, results from other batches are still returned."""
        call_count = 0

        async def mock_complete(messages, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise RuntimeError("Rate limit exhausted")
            return _llm_response_json(
                [{"job_index": 0, "score": 75, "matched_skills": ["Python"]}]
            )

        provider = AsyncMock()
        provider.complete.side_effect = mock_complete

        user = _mock_user()
        jobs = [
            _mock_job(_JOB_ID_1, title="Job A"),
            _mock_job(_JOB_ID_2, title="Job B"),
            _mock_job(_JOB_ID_3, title="Job C"),
        ]

        with patch("workers.services.llm_scorer.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=1,
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(provider, user, jobs)

        # Batch 1 and 3 succeed, batch 2 fails — should get 2 rows
        assert len(rows) == 2

    @pytest.mark.asyncio
    async def test_gather_exception_does_not_lose_other_batches(self) -> None:
        """If _score_batch_llm raises unexpectedly, other batch results survive."""
        batch_call = 0

        async def patched_score_batch(provider, user_context, jobs, batch_index):
            nonlocal batch_call
            batch_call += 1
            if batch_call == 1:
                raise ValueError("Unexpected error in batch")
            return (
                [LLMScoreResult(job_index=0, score=80, matched_skills=["Python"])],
                100,
            )

        user = _mock_user()
        jobs = [
            _mock_job(_JOB_ID_1, title="Job A"),
            _mock_job(_JOB_ID_2, title="Job B"),
        ]

        with (
            patch("workers.services.llm_scorer.get_settings") as mock_settings,
            patch(
                "workers.services.llm_scorer._score_batch_llm",
                side_effect=patched_score_batch,
            ),
        ):
            mock_settings.return_value = SimpleNamespace(
                scoring_model="test-model",
                scoring_max_tokens=1024,
                scoring_batch_size=1,
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(AsyncMock(), user, jobs)

        assert len(rows) == 1
        assert rows[0]["job_id"] == _JOB_ID_2

# LLM Provider Unification & Score Worker Resilience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragmented Anthropic-only LLM access with a unified multi-provider service (Gemini, Anthropic, OpenAI-compat), cap scoring volume per task, and fix partial failure handling so successful batch scores are always saved.

**Architecture:** A new `infra/llm_service.py` module provides a single `LLMProvider` protocol with three implementations. Each call site (score worker, resume parser) gets a convenience factory that returns the configured default provider. The score worker additionally gets a job cap (100 most recent unscored) and `return_exceptions=True` on `asyncio.gather` to save partial results.

**Tech Stack:** Python 3.12, `google-genai` SDK, `anthropic` SDK, `httpx`, SQLAlchemy async, pytest

---

### Task 1: Add `google-genai` dependency and `gemini_api_key` config

**Files:**
- Modify: `backend/pyproject.toml:12-29`
- Modify: `backend/config.py:52-53`

- [ ] **Step 1: Add google-genai to pyproject.toml**

In `backend/pyproject.toml`, add `google-genai` to the dependencies list:

```toml
    "redis (>=5.0.0,<6.0.0)",
    "google-genai (>=1.0.0,<2.0.0)"
```

- [ ] **Step 2: Add gemini_api_key to config.py**

In `backend/config.py`, after the `anthropic_api_key` line (line 52), add:

```python
    gemini_api_key: str = ""
```

- [ ] **Step 3: Install the new dependency**

Run: `cd backend && poetry lock && poetry install`

- [ ] **Step 4: Commit**

```bash
git add backend/pyproject.toml backend/config.py backend/poetry.lock
git commit -m "chore: add google-genai dependency and gemini_api_key config"
```

---

### Task 2: Create unified LLM service (`infra/llm_service.py`)

**Files:**
- Create: `backend/infra/llm_service.py`
- Create: `backend/tests/test_llm_service.py`

- [ ] **Step 1: Write tests for the LLM service**

Create `backend/tests/test_llm_service.py`:

```python
"""Tests for the unified LLM service."""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from infra.llm_service import (
    AnthropicProvider,
    GeminiProvider,
    LLMProvider,
    get_provider,
    get_resume_provider,
    get_scoring_provider,
)


class TestAnthropicProvider:
    @pytest.mark.asyncio
    async def test_complete_returns_text(self) -> None:
        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                anthropic_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = AnthropicProvider()

        mock_response = MagicMock()
        mock_response.content = [MagicMock(type="text", text="hello world")]
        provider._client = AsyncMock()
        provider._client.messages.create = AsyncMock(return_value=mock_response)

        result = await provider.complete(
            [{"role": "user", "content": "test"}],
            model="claude-haiku-4-5-20251001",
        )
        assert result == "hello world"

    @pytest.mark.asyncio
    async def test_retries_on_rate_limit(self) -> None:
        import anthropic as anthropic_mod

        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                anthropic_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = AnthropicProvider()

        mock_response = MagicMock()
        mock_response.content = [MagicMock(type="text", text="ok")]

        provider._client = AsyncMock()
        provider._client.messages.create = AsyncMock(
            side_effect=[
                anthropic_mod.RateLimitError(
                    message="rate limited",
                    response=MagicMock(status_code=429, headers={}),
                    body=None,
                ),
                mock_response,
            ]
        )

        with patch("infra.llm_service.asyncio.sleep", new_callable=AsyncMock):
            result = await provider.complete(
                [{"role": "user", "content": "test"}],
                model="claude-haiku-4-5-20251001",
            )
        assert result == "ok"

    @pytest.mark.asyncio
    async def test_raises_after_max_retries(self) -> None:
        import anthropic as anthropic_mod

        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                anthropic_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = AnthropicProvider()

        rate_limit_err = anthropic_mod.RateLimitError(
            message="rate limited",
            response=MagicMock(status_code=429, headers={}),
            body=None,
        )
        provider._client = AsyncMock()
        provider._client.messages.create = AsyncMock(side_effect=rate_limit_err)

        with (
            patch("infra.llm_service.asyncio.sleep", new_callable=AsyncMock),
            pytest.raises(RuntimeError, match="Exhausted rate-limit retries"),
        ):
            await provider.complete(
                [{"role": "user", "content": "test"}],
                model="claude-haiku-4-5-20251001",
            )


class TestGeminiProvider:
    @pytest.mark.asyncio
    async def test_complete_returns_text(self) -> None:
        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                gemini_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = GeminiProvider()

        mock_response = MagicMock()
        mock_response.text = "hello from gemini"
        provider._client = MagicMock()
        provider._client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        result = await provider.complete(
            [{"role": "user", "content": "test"}],
            model="gemini-2.0-flash",
        )
        assert result == "hello from gemini"

    @pytest.mark.asyncio
    async def test_builds_contents_with_system(self) -> None:
        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                gemini_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = GeminiProvider()

        mock_response = MagicMock()
        mock_response.text = "response"
        provider._client = MagicMock()
        mock_generate = AsyncMock(return_value=mock_response)
        provider._client.aio.models.generate_content = mock_generate

        await provider.complete(
            [{"role": "user", "content": "hello"}],
            system="You are helpful",
            model="gemini-2.0-flash",
        )

        call_kwargs = mock_generate.call_args
        # System instruction should be passed via config
        assert call_kwargs.kwargs.get("config") is not None


class TestProviderFactory:
    def test_get_provider_anthropic(self) -> None:
        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                anthropic_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = get_provider("anthropic")
        assert isinstance(provider, AnthropicProvider)

    def test_get_provider_gemini(self) -> None:
        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                gemini_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = get_provider("gemini")
        assert isinstance(provider, GeminiProvider)

    def test_get_provider_unknown_raises(self) -> None:
        with pytest.raises(ValueError, match="Unknown LLM provider"):
            get_provider("unknown")

    def test_get_scoring_provider_returns_default(self) -> None:
        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                gemini_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = get_scoring_provider()
        assert isinstance(provider, GeminiProvider)

    def test_get_resume_provider_returns_default(self) -> None:
        with patch("infra.llm_service.get_settings") as mock_settings:
            mock_settings.return_value = SimpleNamespace(
                gemini_api_key="test-key",
                scoring_concurrency=3,
            )
            provider = get_resume_provider()
        assert isinstance(provider, GeminiProvider)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_llm_service.py -v`
Expected: FAIL — `infra/llm_service.py` does not exist yet.

- [ ] **Step 3: Create the unified LLM service**

Create `backend/infra/llm_service.py`:

```python
"""Unified LLM provider service.

Single entry point for all LLM calls in the application. Supports Anthropic,
Gemini, and OpenAI-compatible APIs. Each call site uses a convenience factory
that returns the configured default provider.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Protocol, runtime_checkable

import anthropic
import httpx
from google import genai
from google.genai import types as genai_types

from config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Code-level defaults — change these to swap providers per call site
# ---------------------------------------------------------------------------

DEFAULT_SCORING_PROVIDER = "gemini"
DEFAULT_SCORING_MODEL = "gemini-2.0-flash"

DEFAULT_RESUME_PROVIDER = "gemini"
DEFAULT_RESUME_MODEL = "gemini-2.0-flash"

# ---------------------------------------------------------------------------
# Protocol
# ---------------------------------------------------------------------------


@runtime_checkable
class LLMProvider(Protocol):
    """Protocol for LLM completion providers."""

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        system: str = "",
        model: str = "",
        max_tokens: int = 1024,
    ) -> str: ...


# ---------------------------------------------------------------------------
# Anthropic
# ---------------------------------------------------------------------------


class AnthropicProvider:
    """Claude API via the Anthropic SDK.

    Uses a shared AsyncAnthropic client and asyncio.Semaphore for
    concurrency control. Built-in retry on 429 (rate limit) responses.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._semaphore = asyncio.Semaphore(settings.scoring_concurrency)

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        system: str = "",
        model: str = "",
        max_tokens: int = 1024,
    ) -> str:
        async with self._semaphore:
            for attempt in range(3):
                try:
                    kwargs: dict = {
                        "model": model,
                        "max_tokens": max_tokens,
                        "messages": messages,
                    }
                    if system:
                        kwargs["system"] = system

                    response = await self._client.messages.create(**kwargs)
                    return "\n".join(
                        b.text for b in response.content if b.type == "text"
                    )
                except anthropic.RateLimitError:
                    delay = min(2**attempt, 30)
                    logger.warning(
                        "Anthropic rate limited (attempt %d/3), backing off %ds",
                        attempt + 1,
                        delay,
                    )
                    await asyncio.sleep(delay)

            raise RuntimeError("Exhausted rate-limit retries for Anthropic API")


# ---------------------------------------------------------------------------
# Gemini
# ---------------------------------------------------------------------------


class GeminiProvider:
    """Google Gemini API via the google-genai SDK.

    Uses the async interface with semaphore-based concurrency control.
    Built-in retry on rate limit (429) responses.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._semaphore = asyncio.Semaphore(settings.scoring_concurrency)

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        system: str = "",
        model: str = "",
        max_tokens: int = 1024,
    ) -> str:
        contents: list[genai_types.Content] = []
        for msg in messages:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.append(
                genai_types.Content(
                    role=role,
                    parts=[genai_types.Part(text=msg["content"])],
                )
            )

        config = genai_types.GenerateContentConfig(
            max_output_tokens=max_tokens,
            temperature=0.0,
        )
        if system:
            config.system_instruction = system

        async with self._semaphore:
            for attempt in range(3):
                try:
                    response = await self._client.aio.models.generate_content(
                        model=model,
                        contents=contents,
                        config=config,
                    )
                    return response.text or ""
                except Exception as exc:
                    if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                        delay = min(2**attempt, 30)
                        logger.warning(
                            "Gemini rate limited (attempt %d/3), backing off %ds",
                            attempt + 1,
                            delay,
                        )
                        await asyncio.sleep(delay)
                    else:
                        raise

            raise RuntimeError("Exhausted rate-limit retries for Gemini API")


# ---------------------------------------------------------------------------
# OpenAI-compatible (Ollama, vLLM, LM Studio)
# ---------------------------------------------------------------------------


class OpenAICompatProvider:
    """OpenAI-compatible API provider.

    Uses raw httpx — no openai SDK dependency needed. Any server that exposes
    POST /v1/chat/completions with the standard OpenAI request format works.
    """

    def __init__(self, base_url: str, api_key: str = "") -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        settings = get_settings()
        self._semaphore = asyncio.Semaphore(settings.scoring_concurrency)
        self._client = httpx.AsyncClient(timeout=120.0)

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        system: str = "",
        model: str = "",
        max_tokens: int = 1024,
    ) -> str:
        all_messages: list[dict[str, str]] = []
        if system:
            all_messages.append({"role": "system", "content": system})
        all_messages.extend(messages)

        payload = {
            "model": model,
            "messages": all_messages,
            "max_tokens": max_tokens,
            "temperature": 0.0,
        }
        headers: dict[str, str] = {}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        async with self._semaphore:
            resp = await self._client.post(
                f"{self._base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


# ---------------------------------------------------------------------------
# Factory functions
# ---------------------------------------------------------------------------


def get_provider(name: str) -> LLMProvider:
    """Return an LLM provider by name."""
    if name == "anthropic":
        return AnthropicProvider()
    if name == "gemini":
        return GeminiProvider()
    if name == "openai_compat":
        settings = get_settings()
        return OpenAICompatProvider(
            base_url=settings.scoring_openai_base_url,
            api_key=settings.scoring_openai_api_key,
        )
    raise ValueError(f"Unknown LLM provider: {name!r}")


def get_scoring_provider() -> LLMProvider:
    """Return the default provider for job scoring."""
    logger.info("Scoring provider: %s, model: %s", DEFAULT_SCORING_PROVIDER, DEFAULT_SCORING_MODEL)
    return get_provider(DEFAULT_SCORING_PROVIDER)


def get_resume_provider() -> LLMProvider:
    """Return the default provider for resume parsing."""
    logger.info("Resume provider: %s, model: %s", DEFAULT_RESUME_PROVIDER, DEFAULT_RESUME_MODEL)
    return get_provider(DEFAULT_RESUME_PROVIDER)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_llm_service.py -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/infra/llm_service.py backend/tests/test_llm_service.py
git commit -m "feat: add unified LLM service with Gemini, Anthropic, OpenAI-compat providers"
```

---

### Task 3: Rewire score worker to use unified LLM service

**Files:**
- Modify: `backend/workers/services/llm_scorer.py:33`
- Modify: `backend/workers/score.py:18`
- Modify: `backend/tests/test_llm_scorer.py:12-13`

- [ ] **Step 1: Update the import in llm_scorer.py**

In `backend/workers/services/llm_scorer.py`, change line 33:

```python
# Old:
from workers.services.llm_provider import LLMProvider

# New:
from infra.llm_service import LLMProvider
```

- [ ] **Step 2: Update the import in score.py**

In `backend/workers/score.py`, change line 18:

```python
# Old:
from workers.services.llm_provider import LLMProvider, get_scoring_provider

# New:
from infra.llm_service import LLMProvider, get_scoring_provider
```

- [ ] **Step 3: Update the import in test_llm_scorer.py**

No change needed — the tests import from `workers.services.llm_scorer` which re-exports `LLMProvider`. The tests mock the provider directly as `AsyncMock`, so they don't depend on the import path of the provider module.

- [ ] **Step 4: Run existing tests to verify nothing broke**

Run: `cd backend && python -m pytest tests/test_llm_scorer.py tests/test_score_service.py -v`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/workers/services/llm_scorer.py backend/workers/score.py
git commit -m "refactor: rewire score worker to use unified LLM service"
```

---

### Task 4: Rewire resume parser to use unified LLM service

**Files:**
- Modify: `backend/services/resume_parser.py:5,62-68`

- [ ] **Step 1: Update resume_parser.py to use the unified service**

Replace the contents of `backend/services/resume_parser.py`:

```python
import json
import logging

from schemas.profile import ParsedResume
from infra.llm_service import get_resume_provider, DEFAULT_RESUME_MODEL

logger = logging.getLogger(__name__)

RESUME_PARSE_SYSTEM = """You are a resume parser. Given raw text extracted from a resume PDF, extract structured data.
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "full_name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin_url": "string or null",
  "website_url": "string or null",
  "summary": "string or null",
  "experiences": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "description": "string or null",
      "bullets": ["string"],
      "sort_order": 0
    }
  ],
  "educations": [
    {
      "institution": "string",
      "degree": "string or null",
      "field_of_study": "string or null",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "gpa": "string or null",
      "sort_order": 0
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "technical|soft|language|certification",
      "proficiency": "beginner|intermediate|advanced|expert"
    }
  ],
  "raw_text": ""
}

Rules:
- Extract ALL experiences, education, and skills found
- Sort experiences by date (most recent first), set sort_order accordingly (0 = most recent)
- For date fields, approximate to the first of the month if only month/year given (e.g. "Jan 2023" -> "2023-01-01")
- If currently employed, end_date is null
- Categorize skills: programming languages/frameworks/tools = "technical"; communication/leadership = "soft"; spoken languages = "language"; certifications = "certification"
- raw_text should be empty string (caller fills this in)"""


async def parse_resume_text(raw_text: str) -> ParsedResume:
    provider = get_resume_provider()
    response_text = await provider.complete(
        [{"role": "user", "content": f"Parse this resume:\n\n{raw_text}"}],
        system=RESUME_PARSE_SYSTEM,
        model=DEFAULT_RESUME_MODEL,
        max_tokens=4096,
    )

    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1])

    data = json.loads(cleaned)
    data["raw_text"] = raw_text
    return ParsedResume.model_validate(data)
```

- [ ] **Step 2: Run tests to verify nothing broke**

Run: `cd backend && python -m pytest tests/ -v -k "resume" --no-header`
Expected: All resume-related tests PASS (or no tests exist — the parser has no dedicated test file currently).

- [ ] **Step 3: Commit**

```bash
git add backend/services/resume_parser.py
git commit -m "refactor: rewire resume parser to use unified LLM service"
```

---

### Task 5: Add scoring job cap and recency ordering

**Files:**
- Modify: `backend/workers/services/llm_scorer.py:367-418`
- Modify: `backend/tests/test_llm_scorer.py`

- [ ] **Step 1: Write the failing test for job cap**

First, update the `_mock_job` helper in `backend/tests/test_llm_scorer.py` to include `posted_at` in its defaults. Add `posted_at=None` to the defaults dict:

```python
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
```

Then add a new test class at the bottom of the file:

```python
class TestScoreNewJobsLLMCap:
    """Tests for the SCORING_MAX_JOBS_PER_TASK cap and recency ordering."""

    @pytest.mark.asyncio
    async def test_caps_jobs_to_max_per_task(self) -> None:
        """When more unscored jobs than the cap, only the cap number are scored."""
        from workers.services.llm_scorer import score_new_jobs_llm, SCORING_MAX_JOBS_PER_TASK

        mock_user = _mock_user()

        # Create more jobs than the cap, each with a posted_at
        from datetime import timedelta
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

        # All job IDs are "unscored"
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

            # Verify only SCORING_MAX_JOBS_PER_TASK jobs were passed to scoring
            scored_jobs = mock_score.call_args[0][2]  # third positional arg: jobs
            assert len(scored_jobs) == SCORING_MAX_JOBS_PER_TASK

    @pytest.mark.asyncio
    async def test_prioritizes_recent_jobs(self) -> None:
        """Most recently posted jobs should be scored first."""
        from workers.services.llm_scorer import score_new_jobs_llm, SCORING_MAX_JOBS_PER_TASK

        mock_user = _mock_user()

        from datetime import timedelta
        base_time = datetime(2026, 1, 1, tzinfo=timezone.utc)

        # Create jobs: older ones first, newer ones last
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
            # The scored jobs should be the most recent ones
            # The newest job has posted_at = base_time + (num_jobs-1) days
            # Verify they are sorted by posted_at descending
            posted_dates = [j.posted_at for j in scored_jobs]
            assert posted_dates == sorted(posted_dates, reverse=True)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_llm_scorer.py::TestScoreNewJobsLLMCap -v`
Expected: FAIL — `SCORING_MAX_JOBS_PER_TASK` not defined, and the cap/ordering logic doesn't exist yet.

- [ ] **Step 3: Implement the cap and recency ordering**

In `backend/workers/services/llm_scorer.py`, add the constant after the logger line (line 35):

```python
SCORING_MAX_JOBS_PER_TASK = 100
```

Then modify `score_new_jobs_llm`. Replace the block from `unscored_set = set(unscored_ids)` through `jobs_to_score = [j for j in jobs if j.id in unscored_set]` (lines 417-418) with:

```python
        unscored_set = set(unscored_ids)
        jobs_to_score = [j for j in jobs if j.id in unscored_set]

    # Sort by posted_at descending (most recent first) and cap
    jobs_to_score.sort(
        key=lambda j: getattr(j, "posted_at", None) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    jobs_to_score = jobs_to_score[:SCORING_MAX_JOBS_PER_TASK]
```

Note: The sort + cap goes AFTER the `if force / else` block, right before the `_score_jobs_for_user` call. The full modified section (from line 397 onward) should read:

```python
    if force:
        from sqlalchemy import delete

        await db.execute(
            delete(JobMatchScore).where(
                JobMatchScore.user_id == user_id,
                JobMatchScore.job_id.in_(job_ids),
            )
        )
        jobs_to_score = jobs
    else:
        unscored_ids = await get_unscored_job_ids(db, user_id, job_ids)
        if not unscored_ids:
            return {
                "jobs_filtered": len(jobs),
                "jobs_scored": 0,
                "scores_upserted": 0,
                "all_already_scored": True,
            }
        unscored_set = set(unscored_ids)
        jobs_to_score = [j for j in jobs if j.id in unscored_set]

    # Sort by posted_at descending (most recent first) and cap
    jobs_to_score.sort(
        key=lambda j: getattr(j, "posted_at", None) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    jobs_to_score = jobs_to_score[:SCORING_MAX_JOBS_PER_TASK]

    score_rows = await _score_jobs_for_user(provider, user, jobs_to_score)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_llm_scorer.py -v`
Expected: All tests PASS (including existing ones and the two new cap tests).

- [ ] **Step 5: Commit**

```bash
git add backend/workers/services/llm_scorer.py backend/tests/test_llm_scorer.py
git commit -m "feat: cap scoring to 100 most recent unscored jobs per task"
```

---

### Task 6: Fix partial failure handling in batch scoring

**Files:**
- Modify: `backend/workers/services/llm_scorer.py:307-312`
- Modify: `backend/tests/test_llm_scorer.py`

- [ ] **Step 1: Write the failing test for partial failure**

Add to `backend/tests/test_llm_scorer.py`, in the `TestScoreJobsForUser` class:

```python
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
                scoring_batch_size=1,  # 1 job per batch = 3 batches
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(provider, user, jobs)

        # Batch 1 and 3 succeed, batch 2 fails — should get 2 rows
        assert len(rows) == 2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_llm_scorer.py::TestScoreJobsForUser::test_saves_successful_batches_when_one_fails -v`
Expected: FAIL — currently `_score_batch_llm` catches all exceptions and returns `([], 0)`, so actually this test might pass with 2 rows (the exception is caught). Let's verify. If it passes, that means the current `_score_batch_llm` already handles this gracefully for individual batch failures. However, the `RuntimeError` from `AnthropicProvider` when rate limits are exhausted IS caught by the `except Exception` block in `_score_batch_llm` (line 278-280), so it returns `([], 0)`. This means partial failures at the batch level already work for provider exceptions.

The real bug is at the `_score_jobs_for_user` level if `_score_batch_llm` were to propagate an exception. Let's add `return_exceptions=True` as defense-in-depth anyway, to be safe against future provider changes that might not catch exceptions.

- [ ] **Step 3: Add return_exceptions=True to asyncio.gather**

In `backend/workers/services/llm_scorer.py`, modify the `_score_jobs_for_user` function. Replace lines 307-312:

```python
    # Run batches concurrently — provider semaphore handles rate limiting
    tasks = [
        _score_batch_llm(provider, user_context, batch, idx)
        for idx, batch in enumerate(batches)
    ]
    all_results = await asyncio.gather(*tasks)

    score_rows: list[dict] = []
    now = datetime.now(timezone.utc)

    for batch, (results, latency_ms) in zip(batches, all_results):
```

With:

```python
    # Run batches concurrently — provider semaphore handles rate limiting
    tasks = [
        _score_batch_llm(provider, user_context, batch, idx)
        for idx, batch in enumerate(batches)
    ]
    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    score_rows: list[dict] = []
    now = datetime.now(timezone.utc)

    for idx, (batch, result) in enumerate(zip(batches, all_results)):
        if isinstance(result, BaseException):
            logger.error("Batch %d failed: %s", idx, result)
            continue
        results, latency_ms = result
```

- [ ] **Step 4: Write a test that verifies gather-level exception handling**

Add to the `TestScoreJobsForUser` class:

```python
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
                scoring_batch_size=1,  # 1 job per batch
                score_min_threshold=15.0,
            )
            rows = await _score_jobs_for_user(AsyncMock(), user, jobs)

        # Batch 1 raises, batch 2 succeeds — should get 1 row
        assert len(rows) == 1
        assert rows[0]["job_id"] == _JOB_ID_2
```

- [ ] **Step 5: Run all scorer tests**

Run: `cd backend && python -m pytest tests/test_llm_scorer.py -v`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/workers/services/llm_scorer.py backend/tests/test_llm_scorer.py
git commit -m "fix: use return_exceptions=True so partial batch failures save scored results"
```

---

### Task 7: Delete old LLM modules

**Files:**
- Delete: `backend/infra/ai_client.py`
- Delete: `backend/workers/services/llm_provider.py`

- [ ] **Step 1: Check for any remaining imports of the old modules**

Run: `cd backend && grep -rn "from infra.ai_client import\|from workers.services.llm_provider import\|import ai_client\|import llm_provider" --include="*.py" .`

If any files still reference the old modules (besides the ones we've already updated and test files), update them to use `infra.llm_service` instead.

- [ ] **Step 2: Delete the old modules**

```bash
rm backend/infra/ai_client.py
rm backend/workers/services/llm_provider.py
```

- [ ] **Step 3: Run the full test suite to verify nothing is broken**

Run: `cd backend && python -m pytest tests/ -v --tb=short`
Expected: All tests PASS. No import errors.

- [ ] **Step 4: Commit**

```bash
git add -A backend/infra/ai_client.py backend/workers/services/llm_provider.py
git commit -m "chore: remove old ai_client.py and llm_provider.py (replaced by llm_service.py)"
```

---

### Task 8: Update scoring model default to Gemini Flash

**Files:**
- Modify: `backend/config.py:66-67`

- [ ] **Step 1: Update config defaults**

In `backend/config.py`, update the scoring config to use Gemini Flash as default:

```python
    # LLM Scoring
    scoring_provider: str = "gemini"  # "anthropic" | "gemini" | "openai_compat"
    scoring_model: str = "gemini-2.0-flash"
```

- [ ] **Step 2: Run the full test suite**

Run: `cd backend && python -m pytest tests/ -v --tb=short`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/config.py
git commit -m "chore: set Gemini Flash as default scoring model"
```

---

### Task 9: Final integration check

- [ ] **Step 1: Run the full test suite one final time**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests PASS.

- [ ] **Step 2: Run linting**

Run: `cd backend && python -m ruff check .`
Expected: No errors (or only pre-existing ones).

- [ ] **Step 3: Verify the new module structure**

Verify `infra/llm_service.py` exists, `infra/ai_client.py` is gone, `workers/services/llm_provider.py` is gone:

```bash
ls -la backend/infra/llm_service.py
ls -la backend/infra/ai_client.py 2>&1  # should not exist
ls -la backend/workers/services/llm_provider.py 2>&1  # should not exist
```

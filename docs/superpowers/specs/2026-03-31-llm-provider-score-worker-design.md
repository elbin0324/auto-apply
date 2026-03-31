# LLM Provider Unification & Score Worker Resilience

**Date:** 2026-03-31
**Status:** Draft

## Problem

1. **Rate limiting on scoring:** When a new user signs up, the fetch worker pulls a large volume of jobs. The score worker then tries to LLM-score all of them at once, hitting Anthropic rate limits. With only 3 retries and short backoff, the worker exhausts retries quickly.

2. **All-or-nothing failure:** `asyncio.gather` in `_score_jobs_for_user` propagates the first exception. If batch 7/20 fails, batches 1-6's scores are lost — zero scores written to DB.

3. **No Gemini support:** All LLM calls are hardcoded to Anthropic. Gemini Flash offers 1000 RPM and lower cost, making it a better fit for high-volume scoring and enrichment.

4. **Fragmented LLM access:** Two separate modules (`infra/ai_client.py` for resume parsing, `workers/services/llm_provider.py` for scoring) with different patterns for the same thing.

## Solution

### 1. Unified LLM Service (`infra/llm_service.py`)

Replace `infra/ai_client.py` and `workers/services/llm_provider.py` with a single module.

**Provider protocol** (unchanged from existing):

```python
class LLMProvider(Protocol):
    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        system: str = "",
        model: str = "",
        max_tokens: int = 1024,
    ) -> str: ...
```

**Three implementations:**

- `AnthropicProvider` — uses `anthropic.AsyncAnthropic`, semaphore concurrency control, 3-retry rate-limit backoff
- `GeminiProvider` — uses `google-genai` SDK (`google.genai.Client`), async `client.aio.models.generate_content()`, semaphore concurrency control, 3-retry rate-limit backoff
- `OpenAICompatProvider` — uses `httpx.AsyncClient` for Ollama/vLLM/etc., semaphore concurrency control

**Code-level defaults** (not env vars):

```python
# Defaults — change these to swap providers
DEFAULT_SCORING_PROVIDER = "gemini"
DEFAULT_SCORING_MODEL = "gemini-2.0-flash"

DEFAULT_RESUME_PROVIDER = "gemini"
DEFAULT_RESUME_MODEL = "gemini-2.0-flash"
```

**Factory functions:**

- `get_provider(name: str) -> LLMProvider` — general factory
- `get_scoring_provider() -> LLMProvider` — uses `DEFAULT_SCORING_PROVIDER`
- `get_resume_provider() -> LLMProvider` — uses `DEFAULT_RESUME_PROVIDER`

### 2. Score Worker — Cap, Recency, and Partial Failure

**Job cap per task:**

- Add `SCORING_MAX_JOBS_PER_TASK = 100` constant in `workers/services/llm_scorer.py`
- In `score_new_jobs_llm`, after filtering to unscored jobs, order by `posted_at DESC` and take at most 100
- 100 jobs = 10 batches = 10 LLM calls per user per run
- Daily cron naturally catches up on older unscored jobs in subsequent runs

**Partial failure handling:**

Replace `asyncio.gather(*tasks)` with `asyncio.gather(*tasks, return_exceptions=True)`:

```python
all_results = await asyncio.gather(*tasks, return_exceptions=True)

for batch, result in zip(batches, all_results):
    if isinstance(result, Exception):
        logger.error("Batch %d failed: %s", idx, result)
        continue
    # process (results, latency_ms) as before
```

- Successful batches' scores are collected and written to DB
- Failed batches are logged and skipped
- No re-enqueue logic — daily cron re-triggers scoring, `get_unscored_job_ids` picks up whatever's missing

### 3. Call Site Rewiring

**Score worker (`workers/services/llm_scorer.py`):**
- Import `get_scoring_provider` from `infra.llm_service`
- Already uses `LLMProvider` protocol — minimal change

**Resume parser (`backend/services/resume_parser.py`):**
- Replace `chat_completion` import with `get_resume_provider().complete()`
- Remove dependency on `infra/ai_client.py`

### 4. Config and Dependencies

**New config field (`config.py`):**
- `gemini_api_key: str = ""` — loaded from environment

**New dependency (`pyproject.toml`):**
- `google-genai` — Google's official Python SDK for Gemini

**Files deleted:**
- `infra/ai_client.py`
- `workers/services/llm_provider.py`

**Files created:**
- `infra/llm_service.py`

**Tests:**
- Update score worker tests for new provider import path
- Update resume parser tests for new provider interface
- Add unit tests for `GeminiProvider` (mock the SDK client)

## Out of Scope

- Enrich worker (deprecated)
- Stale job reaper cron (separate future work)
- Env-var-based provider switching (defaults are in code)
- Fallback chains (try Gemini, fall back to Claude)

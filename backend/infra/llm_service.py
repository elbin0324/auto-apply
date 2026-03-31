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
DEFAULT_SCORING_MODEL = "gemini-2.5-flash"

DEFAULT_RESUME_PROVIDER = "gemini"
DEFAULT_RESUME_MODEL = "gemini-2.5-flash"

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

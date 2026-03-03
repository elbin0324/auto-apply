"""LLM provider abstraction for job scoring.

Supports Anthropic API (Claude) and OpenAI-compatible APIs (Ollama, vLLM, etc.).
Providers are initialized once per worker process and reuse a shared client + semaphore.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Protocol, runtime_checkable

import anthropic
import httpx

from config import get_settings

logger = logging.getLogger(__name__)


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
        settings = get_settings()
        model = model or settings.scoring_model

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
                        "Rate limited (attempt %d/3), backing off %ds", attempt + 1, delay
                    )
                    await asyncio.sleep(delay)

            raise RuntimeError("Exhausted rate-limit retries for Anthropic API")


class OpenAICompatProvider:
    """OpenAI-compatible API provider (Ollama, llama.cpp, vLLM, LM Studio).

    Uses raw httpx — no openai SDK dependency needed. Any server that exposes
    POST /v1/chat/completions with the standard OpenAI request format works.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.scoring_openai_base_url.rstrip("/")
        self._api_key = settings.scoring_openai_api_key
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
        settings = get_settings()
        model = model or settings.scoring_model

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


def get_scoring_provider() -> LLMProvider:
    """Factory: returns the configured scoring LLM provider.

    Call once at worker startup and reuse the returned instance.
    """
    settings = get_settings()
    if settings.scoring_provider == "openai_compat":
        if not settings.scoring_openai_base_url:
            raise ValueError(
                "scoring_openai_base_url must be set when scoring_provider='openai_compat'"
            )
        logger.info("Using OpenAI-compatible scoring provider: %s", settings.scoring_openai_base_url)
        return OpenAICompatProvider()

    logger.info("Using Anthropic scoring provider, model=%s", settings.scoring_model)
    return AnthropicProvider()

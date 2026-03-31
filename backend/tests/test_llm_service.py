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

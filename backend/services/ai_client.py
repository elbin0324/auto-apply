import logging

import anthropic

from config import get_settings

logger = logging.getLogger(__name__)


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    settings = get_settings()
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


async def chat_completion(
    prompt: str,
    system: str = "",
    model: str = "claude-sonnet-4-6-20250514",
    max_tokens: int = 4096,
) -> str:
    client = get_anthropic_client()
    messages: list[dict[str, str]] = [{"role": "user", "content": prompt}]

    kwargs: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system

    response = await client.messages.create(**kwargs)

    text_blocks = [block.text for block in response.content if block.type == "text"]
    return "\n".join(text_blocks)

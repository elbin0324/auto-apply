from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    env: str = "development"
    version: str = "0.1.0"
    log_level: str = "INFO"
    log_format: str = "json"  # "json" for Railway/production, "text" for local dev
    allowed_origins: str = "http://localhost:3000"

    # Database
    database_url: str

    @field_validator("database_url")
    @classmethod
    def ensure_asyncpg_scheme(cls, v: str) -> str:
        for plain in ("postgresql://", "postgres://"):
            if v.startswith(plain):
                return "postgresql+asyncpg://" + v[len(plain):]
        return v

    # Redis / Queue
    redis_url: str = "redis://localhost:6379"

    @field_validator("redis_url")
    @classmethod
    def ensure_redis_scheme(cls, v: str) -> str:
        """Normalize Redis URLs from various providers (Railway, Upstash, etc.)."""
        if v.startswith(("redis://", "rediss://", "unix://")):
            return v
        # Some providers omit the scheme entirely (e.g. "host:port")
        if "://" not in v:
            return f"redis://{v}"
        return v

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # AI
    anthropic_api_key: str
    gemini_api_key: str = ""

    # Job data — Active Jobs DB API (primary source via RapidAPI)
    rapidapi_key: str = ""  # RapidAPI key (Active Jobs DB API)

    # Job enrichment (LLM-based description processing)
    enrichment_model: str = "claude-haiku-4-5-20251001"
    enrichment_max_tokens: int = 2048
    enrichment_batch_size: int = 50  # max jobs to enrich per periodic run

    # Score settings
    score_min_threshold: float = 15.0  # minimum combined score to store

    # LLM Scoring
    scoring_provider: str = "gemini"  # "anthropic" | "gemini" | "openai_compat"
    scoring_model: str = "gemini-3.1-flash-lite-preview"
    scoring_max_tokens: int = 4096
    scoring_batch_size: int = 10  # jobs per LLM call
    scoring_concurrency: int = 3  # max parallel LLM calls per worker
    scoring_use_llm: bool = True  # False = heuristic only (rollback)
    scoring_openai_base_url: str = ""  # for openai_compat provider (Ollama, vLLM, etc.)
    scoring_openai_api_key: str = ""  # for openai_compat provider

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_starter_price_id: str = ""
    stripe_pro_price_id: str = ""
    stripe_premium_price_id: str = ""
    stripe_credits_10_price_id: str = ""
    stripe_credits_50_price_id: str = ""
    stripe_credits_100_price_id: str = ""
    stripe_credits_250_price_id: str = ""

    # Internal auth (agent → platform)
    internal_api_key: str

    # OAuth (unused — Supabase handles OAuth directly; kept for .env compat)
    google_client_id: str = ""
    google_client_secret: str = ""

    # Monitoring
    sentry_dsn: str = ""

    @field_validator("allowed_origins")
    @classmethod
    def parse_origins(cls, v: str) -> str:
        return v

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()

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

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # AI
    anthropic_api_key: str

    # Job data — Adzuna (optional legacy source)
    adzuna_app_id: str = ""
    adzuna_api_key: str = ""
    adzuna_sync_country: str = "ca"
    adzuna_sync_categories: str = "it-jobs"  # comma-separated for multiple
    adzuna_sync_pages: int = 5

    # Job discovery — ATS crawlers
    discovery_concurrency: int = 5  # Max companies to crawl in parallel
    workday_request_delay: float = 1.0  # Seconds between Workday API requests

    # Voyage AI embeddings
    voyage_api_key: str = ""
    voyage_model: str = "voyage-4-large"
    voyage_batch_size: int = 128  # texts per API call (max 1000)

    # Crawl queue settings
    crawl_stale_hours: int = 6  # hours before a company is re-crawled
    crawl_concurrency: int = 3  # parallel crawls within one worker process

    # Score settings
    vector_search_limit: int = 200  # top-K from vector search before re-ranking
    score_min_threshold: float = 15.0  # minimum combined score to store

    # Stripe (optional until billing is implemented)
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_premium_price_id: str = ""
    stripe_credits_10_price_id: str = ""
    stripe_credits_50_price_id: str = ""
    stripe_credits_100_price_id: str = ""
    stripe_credits_250_price_id: str = ""

    # Internal auth (agent → platform)
    internal_api_key: str

    # OAuth
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

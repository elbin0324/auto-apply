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

    # Redis / Queue
    redis_url: str = "redis://localhost:6379"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # AI
    anthropic_api_key: str

    # Job data
    adzuna_app_id: str
    adzuna_api_key: str

    # Stripe
    stripe_secret_key: str
    stripe_publishable_key: str
    stripe_webhook_secret: str
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

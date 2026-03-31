import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import admin, applications, auth, auto_apply, billing, dashboard, health, jobs, profile, sse
from infra.logging_config import setup_logging

settings = get_settings()

setup_logging("api")
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup — initialise Sentry if configured
    if settings.sentry_dsn:
        import sentry_sdk

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.env,
            release=settings.version,
            traces_sample_rate=0.1,
        )
    yield
    # Shutdown
    from infra.redis_pool import close_pool

    await close_pool()


def create_app() -> FastAPI:
    app = FastAPI(
        title="auto-apply API",
        version=settings.version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(profile.router, prefix="/api")
    app.include_router(jobs.router, prefix="/api")
    app.include_router(auto_apply.router, prefix="/api")
    app.include_router(dashboard.router, prefix="/api")
    app.include_router(applications.router, prefix="/api")
    app.include_router(applications.internal_router, prefix="/api")
    app.include_router(applications.scheduler_router, prefix="/api")
    app.include_router(sse.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    app.include_router(billing.router, prefix="/api")

    return app


app = create_app()
app.router.lifespan_context = lifespan

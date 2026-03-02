from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import admin, applications, auth, auto_apply, companies, health, jobs, profile

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    yield
    # Shutdown


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
    app.include_router(applications.router, prefix="/api")
    app.include_router(applications.internal_router, prefix="/api")
    app.include_router(applications.scheduler_router, prefix="/api")
    app.include_router(companies.router, prefix="/api")
    app.include_router(companies.internal_router, prefix="/api")
    app.include_router(companies.discovery_router, prefix="/api")
    app.include_router(admin.router, prefix="/api")

    return app


app = create_app()
app.router.lifespan_context = lifespan

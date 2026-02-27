from fastapi import APIRouter
from pydantic import BaseModel

from config import get_settings

router = APIRouter(tags=["health"])
settings = get_settings()


class HealthResponse(BaseModel):
    status: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", version=settings.version)

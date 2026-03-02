import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status

from deps import CurrentUser, DbSession, verify_internal_api_key
from schemas.application import (
    ApplicationDetail,
    ApplicationListResponse,
    ApplicationStats,
)
from schemas.auto_apply import ApplyResult
from services.application_service import (
    get_application,
    get_application_stats,
    list_applications,
    process_agent_result,
)

logger = logging.getLogger(__name__)

# ── User-facing endpoints ────────────────────────────────────────────────────

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=ApplicationListResponse)
async def list_user_applications(
    user: CurrentUser,
    db: DbSession,
    status_filter: str | None = Query(None, alias="status"),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
) -> ApplicationListResponse:
    return await list_applications(
        db, user.id, status_filter, date_from, date_to, page, per_page
    )


@router.get("/stats", response_model=ApplicationStats)
async def application_stats(
    user: CurrentUser,
    db: DbSession,
) -> ApplicationStats:
    return await get_application_stats(db, user.id)


@router.get("/{application_id}", response_model=ApplicationDetail)
async def get_application_detail(
    application_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
) -> ApplicationDetail:
    application = await get_application(db, user.id, application_id)
    return ApplicationDetail.model_validate(application)


# ── Internal endpoint (agent workers) ────────────────────────────────────────

internal_router = APIRouter(
    prefix="/internal/applications", tags=["internal"]
)


@internal_router.post(
    "/result",
    dependencies=[Depends(verify_internal_api_key)],
    status_code=status.HTTP_200_OK,
)
async def receive_agent_result(body: ApplyResult, db: DbSession) -> dict:
    application = await process_agent_result(db, body)
    return {
        "application_id": str(application.id),
        "status": application.status,
    }

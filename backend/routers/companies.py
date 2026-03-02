import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from deps import CurrentUser, DbSession, verify_internal_api_key
from models.company import Company
from schemas.company import (
    ATSDetectResult,
    CompanyCreate,
    CompanyListResponse,
    CompanyResponse,
    CompanySuggest,
    CompanyUpdate,
    VALID_ATS_TYPES,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["companies"])
internal_router = APIRouter(prefix="/internal/companies", tags=["companies-internal"])
discovery_router = APIRouter(prefix="/internal/discovery", tags=["discovery"])


# ── User-facing endpoints ──────────────────────────────────────────────────


@router.get("", response_model=CompanyListResponse)
async def list_companies(
    user: CurrentUser,
    db: DbSession,
    search: str | None = Query(None),
    ats_type: str | None = Query(None),
    industry: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
) -> CompanyListResponse:
    """List companies in the registry."""
    stmt = select(Company).where(Company.is_active.is_(True))

    if search:
        stmt = stmt.where(
            Company.name.ilike(f"%{search}%") | Company.slug.ilike(f"%{search}%")
        )
    if ats_type:
        stmt = stmt.where(Company.ats_type == ats_type)
    if industry:
        stmt = stmt.where(Company.industry.ilike(f"%{industry}%"))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    offset = (page - 1) * per_page
    stmt = stmt.order_by(Company.name).offset(offset).limit(per_page)

    result = await db.execute(stmt)
    companies = result.scalars().all()

    return CompanyListResponse(
        companies=[CompanyResponse.model_validate(c) for c in companies],
        total=total,
    )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
) -> CompanyResponse:
    """Get a single company detail."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )
    return CompanyResponse.model_validate(company)


@router.post("/suggest", status_code=status.HTTP_202_ACCEPTED)
async def suggest_company(
    body: CompanySuggest,
    user: CurrentUser,
    db: DbSession,
) -> dict:
    """User suggests a company to add. Detects ATS type from career page URL."""
    detected = detect_ats_from_url(body.career_page_url)
    if detected.ats_type and detected.board_token:
        # Auto-add if we can detect the ATS
        slug = re.sub(r"[^a-z0-9\-]", "", body.name.lower().replace(" ", "-"))
        existing = await db.execute(
            select(Company).where(Company.slug == slug)
        )
        if existing.scalar_one_or_none():
            return {"status": "already_exists", "slug": slug}

        company = Company(
            name=body.name,
            slug=slug,
            ats_type=detected.ats_type,
            board_token=detected.board_token,
            career_page_url=body.career_page_url,
            ats_base_url=detected.ats_base_url,
        )
        db.add(company)
        await db.flush()
        return {
            "status": "added",
            "slug": slug,
            "ats_type": detected.ats_type,
            "company_id": str(company.id),
        }

    return {
        "status": "pending_review",
        "message": "Could not auto-detect ATS type. Your suggestion has been noted.",
    }


# ── Internal admin endpoints ──────────────────────────────────────────────


@internal_router.post(
    "",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_internal_api_key)],
)
async def create_company(body: CompanyCreate, db: DbSession) -> CompanyResponse:
    """Add a company to the registry (admin)."""
    if body.ats_type not in VALID_ATS_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"ats_type must be one of: {VALID_ATS_TYPES}",
        )

    existing = await db.execute(
        select(Company).where(Company.slug == body.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Company with slug '{body.slug}' already exists",
        )

    company = Company(**body.model_dump())
    db.add(company)
    await db.flush()
    return CompanyResponse.model_validate(company)


@internal_router.put(
    "/{company_id}",
    response_model=CompanyResponse,
    dependencies=[Depends(verify_internal_api_key)],
)
async def update_company(
    company_id: uuid.UUID, body: CompanyUpdate, db: DbSession
) -> CompanyResponse:
    """Update a company in the registry (admin)."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )

    update_data = body.model_dump(exclude_unset=True)
    if "ats_type" in update_data and update_data["ats_type"] not in VALID_ATS_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"ats_type must be one of: {VALID_ATS_TYPES}",
        )

    for field, value in update_data.items():
        setattr(company, field, value)
    await db.flush()
    return CompanyResponse.model_validate(company)


@internal_router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_internal_api_key)],
)
async def delete_company(company_id: uuid.UUID, db: DbSession) -> None:
    """Soft-delete a company (deactivate, admin)."""
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )
    company.is_active = False
    await db.flush()


@internal_router.post(
    "/detect-ats",
    response_model=ATSDetectResult,
    dependencies=[Depends(verify_internal_api_key)],
)
async def detect_ats_endpoint(
    body: CompanySuggest,
    db: DbSession,
) -> ATSDetectResult:
    """Detect ATS type from a career page URL."""
    return detect_ats_from_url(body.career_page_url)


# ── Discovery trigger endpoints ──────────────────────────────────────────


@discovery_router.post(
    "/run",
    dependencies=[Depends(verify_internal_api_key)],
)
async def trigger_discovery(
    db: DbSession,
    ats_types: list[str] | None = Query(None),
) -> dict:
    """Trigger a full crawl of all active companies."""
    from services.job_discovery import run_discovery
    from services.job_matcher import compute_scores_for_sync

    discovery_stats = await run_discovery(db, ats_types=ats_types)

    # Compute match scores for newly discovered jobs
    # Collect all external_ids from results
    all_external_ids = []
    for r in discovery_stats.get("results", []):
        # We don't track individual IDs in CrawlResult, so trigger full re-score
        pass

    score_stats = await compute_scores_for_sync(db, synced_external_ids=[])
    await db.commit()

    return {
        "discovery": {k: v for k, v in discovery_stats.items() if k != "results"},
        "scoring": score_stats,
        "details": discovery_stats.get("results", []),
    }


@discovery_router.post(
    "/company/{company_slug}",
    dependencies=[Depends(verify_internal_api_key)],
)
async def trigger_company_discovery(
    company_slug: str,
    db: DbSession,
) -> dict:
    """Trigger a crawl for a single company."""
    from services.job_discovery import crawl_company

    result = await db.execute(
        select(Company).where(Company.slug == company_slug, Company.is_active.is_(True))
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )

    crawl_result = await crawl_company(db, company)
    await db.commit()
    return crawl_result.model_dump()


# ── ATS detection utility ────────────────────────────────────────────────

# Patterns for detecting ATS from career page URLs
_GREENHOUSE_PATTERNS = [
    re.compile(r"boards\.greenhouse\.io/(\w+)"),
    re.compile(r"job-boards\.greenhouse\.io/(\w+)"),
]
_LEVER_PATTERNS = [
    re.compile(r"jobs\.lever\.co/(\w[\w\-]*)"),
]
_ASHBY_PATTERNS = [
    re.compile(r"jobs\.ashbyhq\.com/([\w\-]+)"),
]
_SMARTRECRUITERS_PATTERNS = [
    re.compile(r"careers\.smartrecruiters\.com/([\w\-]+)"),
    re.compile(r"jobs\.smartrecruiters\.com/([\w\-]+)"),
]
_WORKDAY_PATTERN = re.compile(
    r"([\w\-]+)\.(wd\d+)\.myworkdayjobs\.com(?:/en-US)?/([\w\-]+)"
)


def detect_ats_from_url(url: str) -> ATSDetectResult:
    """Detect ATS type and board token from a career page URL."""
    for pattern in _GREENHOUSE_PATTERNS:
        match = pattern.search(url)
        if match:
            return ATSDetectResult(
                ats_type="greenhouse",
                board_token=match.group(1),
                confidence="high",
            )

    for pattern in _LEVER_PATTERNS:
        match = pattern.search(url)
        if match:
            return ATSDetectResult(
                ats_type="lever",
                board_token=match.group(1),
                confidence="high",
            )

    for pattern in _ASHBY_PATTERNS:
        match = pattern.search(url)
        if match:
            return ATSDetectResult(
                ats_type="ashby",
                board_token=match.group(1),
                confidence="high",
            )

    for pattern in _SMARTRECRUITERS_PATTERNS:
        match = pattern.search(url)
        if match:
            return ATSDetectResult(
                ats_type="smartrecruiters",
                board_token=match.group(1),
                confidence="high",
            )

    match = _WORKDAY_PATTERN.search(url)
    if match:
        company_slug = match.group(1)
        wd_instance = match.group(2)
        site_name = match.group(3)
        base_url = f"{company_slug}.{wd_instance}.myworkdayjobs.com/wday/cxs/{company_slug}/{site_name}"
        return ATSDetectResult(
            ats_type="workday",
            board_token=site_name,
            ats_base_url=base_url,
            confidence="high",
        )

    return ATSDetectResult(confidence="unknown")

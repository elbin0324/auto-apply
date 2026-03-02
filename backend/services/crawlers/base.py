import logging
import re
from abc import ABC, abstractmethod
from datetime import datetime

from pydantic import BaseModel

from models.company import Company

logger = logging.getLogger(__name__)


class RawJobListing(BaseModel):
    """Normalized job listing from any ATS crawler."""

    external_id: str
    title: str
    company_name: str
    location: str | None = None
    location_type: str | None = None  # remote, hybrid, onsite
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str = "CAD"
    description: str | None = None
    url: str  # Job posting page
    apply_url: str  # Direct application form URL
    department: str | None = None
    posted_at: datetime | None = None
    tags: list[str] = []


class CrawlResult(BaseModel):
    """Stats returned after crawling a single company."""

    company_slug: str
    ats_type: str
    jobs_found: int = 0
    jobs_upserted: int = 0
    jobs_deactivated: int = 0
    error: str | None = None


_TAG_RE = re.compile(r"<[^>]+>")


def strip_html(html: str | None) -> str | None:
    """Strip HTML tags and collapse whitespace."""
    if not html:
        return None
    text = _TAG_RE.sub(" ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_location_type(
    is_remote: bool | None = None,
    workplace_type: str | None = None,
    location_text: str | None = None,
) -> str | None:
    """Normalize location type to remote/hybrid/onsite."""
    if is_remote:
        return "remote"
    if workplace_type:
        wt = workplace_type.lower()
        if "remote" in wt:
            return "remote"
        if "hybrid" in wt:
            return "hybrid"
        if "onsite" in wt or "on-site" in wt or "in-office" in wt:
            return "onsite"
    if location_text and "remote" in location_text.lower():
        return "remote"
    return None


class ATSCrawler(ABC):
    """Base class for all ATS platform crawlers."""

    @abstractmethod
    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        """Fetch all active job listings for a company from its ATS."""
        ...

    def build_external_id(self, company: Company, ats_job_id: str) -> str:
        """Build a globally unique external_id: {ats_type}:{board_token}:{job_id}."""
        return f"{company.ats_type}:{company.board_token}:{ats_job_id}"

# Plan: Replace Adzuna with Direct ATS Career Page Crawling

## Problem

The current job pipeline uses Adzuna API, which returns links to Adzuna's landing pages — not the actual employer application forms. The apply-agents need direct application URLs to function. Aggregator data is also stale, truncated, and full of duplicates.

## Solution

Replace the Adzuna-based job sync with a **company registry + ATS crawler** system that pulls jobs directly from company career pages via their public APIs (Greenhouse, Lever, Ashby, SmartRecruiters) and structured scraping (Workday).

## Architecture

```
Company Registry (new table)
  └── company_name, ats_type, board_token, career_url, is_active
       │
       ▼
ATS Crawlers (one per platform, common interface)
  ├── GreenhouseCrawler   → GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
  ├── LeverCrawler        → GET api.lever.co/v0/postings/{slug}?mode=json
  ├── AshbyCrawler        → GET api.ashbyhq.com/posting-api/job-board/{name}
  ├── SmartRecruitersCrawler → GET api.smartrecruiters.com/v1/companies/{id}/postings
  └── WorkdayCrawler      → POST {company}.{wd}.myworkdayjobs.com/wday/cxs/.../jobs
       │
       ▼
Jobs table (existing, minor changes)
  - source = "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "workday"
  - external_id = "{ats_type}:{company_slug}:{ats_job_id}" (globally unique)
  - url = direct apply URL (guaranteed real application page)
  - apply_url = separate field for direct apply link when available
  - company_id = FK to company registry (new)
       │
       ▼
Existing pipeline (matching → auto-apply → queue → agents) — unchanged
```

## Implementation Steps

### Step 1: New `companies` Table + Model

Add a `companies` table to serve as the company registry:

```python
# models/company.py
class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: UUID (PK)
    name: str                    # "Stripe"
    slug: str (unique, indexed)  # "stripe" — normalized lowercase
    ats_type: str                # "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "workday"
    board_token: str             # ATS-specific identifier (board token, slug, company ID)
    career_page_url: str | None  # Original career page URL for reference
    ats_base_url: str | None     # For Workday: "stripe.wd5.myworkdayjobs.com"
    logo_url: str | None
    industry: str | None
    is_active: bool = True       # Enable/disable crawling
    last_crawled_at: datetime | None
    job_count: int = 0           # Cached count of active jobs
```

Generate Alembic migration. Add FK from `jobs.company_id → companies.id` (nullable for backward compat with any existing Adzuna jobs).

**Files:**
- Create `backend/models/company.py`
- Create `backend/schemas/company.py`
- Update `backend/models/__init__.py`
- Generate migration

### Step 2: Update Job Model

Add fields to the existing `Job` model:

```python
# Add to models/job.py
company_id: UUID | None  # FK to companies table (nullable)
apply_url: str | None     # Direct application form URL (separate from job posting URL)
```

Update `external_id` convention to `{ats_type}:{board_token}:{job_id}` for global uniqueness across ATS platforms.

Update `JobResponse` schema to include `apply_url`.

**Files:**
- Edit `backend/models/job.py` — add `company_id` FK and `apply_url`
- Edit `backend/schemas/job.py` — add `apply_url` to `JobResponse`
- Generate migration for new columns

### Step 3: ATS Crawler Base + Greenhouse Crawler

Create the crawler framework with a base class and the first (highest value) implementation:

```python
# services/crawlers/base.py
class ATSCrawler(ABC):
    """Base class for all ATS crawlers."""

    @abstractmethod
    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        """Fetch all active jobs for a company. Returns normalized job dicts."""
        ...

    @abstractmethod
    def get_apply_url(self, raw_job: dict) -> str:
        """Extract the direct application URL from the raw API response."""
        ...

    def build_external_id(self, company: Company, ats_job_id: str) -> str:
        return f"{company.ats_type}:{company.board_token}:{ats_job_id}"

# Intermediate normalized format
class RawJobListing(BaseModel):
    external_id: str
    title: str
    company_name: str
    location: str | None
    location_type: str | None   # remote, hybrid, onsite
    salary_min: float | None
    salary_max: float | None
    salary_currency: str = "CAD"
    description: str | None     # Plain text (stripped from HTML)
    description_html: str | None
    url: str                    # Job posting page
    apply_url: str              # Direct application form URL
    department: str | None
    posted_at: datetime | None
    tags: list[str] = []
```

```python
# services/crawlers/greenhouse.py
class GreenhouseCrawler(ATSCrawler):
    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        url = f"{self.BASE_URL}/{company.board_token}/jobs?content=true"
        # GET, parse response, normalize to RawJobListing
        # absolute_url → url, construct apply URL
        # Strip HTML from content → description
        # No rate limit, no auth needed
```

**Files:**
- Create `backend/services/crawlers/__init__.py`
- Create `backend/services/crawlers/base.py`
- Create `backend/services/crawlers/greenhouse.py`
- Create `backend/tests/test_greenhouse_crawler.py`

### Step 4: Lever + Ashby Crawlers

```python
# services/crawlers/lever.py
class LeverCrawler(ATSCrawler):
    BASE_URL = "https://api.lever.co/v0/postings"

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        url = f"{self.BASE_URL}/{company.board_token}?mode=json"
        # applyUrl field is direct apply link
        # Has salaryRange with min, max, currency
        # descriptionPlain for text, description for HTML

# services/crawlers/ashby.py
class AshbyCrawler(ATSCrawler):
    BASE_URL = "https://api.ashbyhq.com/posting-api/job-board"

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        url = f"{self.BASE_URL}/{company.board_token}?includeCompensation=true"
        # Returns all jobs in single response
        # applyUrl field, descriptionPlain/descriptionHtml
        # isRemote, workplaceType fields
```

**Files:**
- Create `backend/services/crawlers/lever.py`
- Create `backend/services/crawlers/ashby.py`
- Create `backend/tests/test_lever_crawler.py`
- Create `backend/tests/test_ashby_crawler.py`

### Step 5: SmartRecruiters + Workday Crawlers

```python
# services/crawlers/smartrecruiters.py
class SmartRecruitersCrawler(ATSCrawler):
    BASE_URL = "https://api.smartrecruiters.com/v1/companies"

    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        # Paginated: offset + limit (max 100)
        # Need to fetch detail for each job to get applyUrl
        # Or just construct: https://jobs.smartrecruiters.com/{id}/{postingId}/apply

# services/crawlers/workday.py
class WorkdayCrawler(ATSCrawler):
    async def fetch_jobs(self, company: Company) -> list[RawJobListing]:
        # POST to {ats_base_url}/wday/cxs/{slug}/{site}/jobs
        # Paginated via offset + limit
        # Undocumented API — needs careful error handling
        # apply_url constructed from externalPath
```

**Files:**
- Create `backend/services/crawlers/smartrecruiters.py`
- Create `backend/services/crawlers/workday.py`
- Create `backend/tests/test_smartrecruiters_crawler.py`
- Create `backend/tests/test_workday_crawler.py`

### Step 6: Job Discovery Service (Replaces `job_sync.py`)

New orchestration service that replaces `run_sync()`:

```python
# services/job_discovery.py

CRAWLER_REGISTRY: dict[str, type[ATSCrawler]] = {
    "greenhouse": GreenhouseCrawler,
    "lever": LeverCrawler,
    "ashby": AshbyCrawler,
    "smartrecruiters": SmartRecruitersCrawler,
    "workday": WorkdayCrawler,
}

async def crawl_company(db, company: Company) -> CrawlResult:
    """Crawl a single company, upsert jobs, return stats."""
    crawler = CRAWLER_REGISTRY[company.ats_type]()
    raw_jobs = await crawler.fetch_jobs(company)
    # Upsert each RawJobListing into jobs table
    # Set company_id on each job
    # Deactivate jobs that were NOT in this crawl's results
    # Update company.last_crawled_at and job_count
    # Return stats

async def run_discovery(db, ats_types: list[str] | None = None) -> DiscoveryResult:
    """Crawl all active companies (optionally filtered by ATS type)."""
    companies = await get_active_companies(db, ats_types)
    results = []
    for company in companies:
        result = await crawl_company(db, company)
        results.append(result)
    # Aggregate stats
    # Then trigger score computation (reuse existing job_matcher)
```

The existing `job_matcher.py` is reused unchanged — it operates on the `jobs` table regardless of source.

**Files:**
- Create `backend/services/job_discovery.py`
- Keep `backend/services/job_sync.py` for now (can deprecate later)
- Create `backend/tests/test_job_discovery.py`

### Step 7: Company Registry Router

API endpoints for managing the company registry:

```python
# routers/companies.py

# Admin/internal endpoints
POST   /api/companies                    # Add a company to registry (admin)
GET    /api/companies                    # List companies with filters
GET    /api/companies/{id}              # Company detail + job count
PUT    /api/companies/{id}              # Update company (admin)
DELETE /api/companies/{id}              # Soft-delete (admin)

# User-facing
POST   /api/companies/suggest           # User suggests a company to add
GET    /api/companies/search            # Search registry by name

# Internal
POST   /api/companies/detect-ats        # Given a career page URL, detect ATS type
POST   /api/internal/discovery/run      # Trigger full crawl (internal API key)
POST   /api/internal/discovery/company/{id}  # Crawl single company (internal API key)
```

The `detect-ats` endpoint would check a career page URL against known patterns:
- `boards.greenhouse.io/{token}` or embedded Greenhouse → greenhouse
- `jobs.lever.co/{slug}` → lever
- `jobs.ashbyhq.com/{name}` → ashby
- `careers.smartrecruiters.com/{id}` → smartrecruiters
- `*.myworkdayjobs.com` → workday

**Files:**
- Create `backend/routers/companies.py`
- Create `backend/schemas/company.py` (if not done in Step 1)
- Mount in `backend/main.py`
- Create `backend/tests/test_companies_router.py`

### Step 8: Update Jobs Router

Update the existing `/api/jobs` endpoint:
- Add `company_id` filter parameter
- Add `source` filter parameter (filter by ATS type)
- Add `apply_url` to job response
- Update `/api/jobs/sync` to call `run_discovery()` instead of (or alongside) Adzuna sync

**Files:**
- Edit `backend/routers/jobs.py`
- Edit `backend/schemas/job.py`

### Step 9: Seed Data — Initial Company Registry

Create a seed script with ~200-500 tech companies and their ATS info:

```python
# scripts/seed_companies.py
SEED_COMPANIES = [
    # Greenhouse
    {"name": "Stripe", "ats_type": "greenhouse", "board_token": "stripe"},
    {"name": "Cloudflare", "ats_type": "greenhouse", "board_token": "cloudflare"},
    {"name": "Figma", "ats_type": "greenhouse", "board_token": "figma"},
    {"name": "Datadog", "ats_type": "greenhouse", "board_token": "datadoghq"},
    {"name": "Notion", "ats_type": "greenhouse", "board_token": "notion"},
    # Lever
    {"name": "Netflix", "ats_type": "lever", "board_token": "netflix"},
    # Ashby
    {"name": "Ramp", "ats_type": "ashby", "board_token": "ramp"},
    # ... etc
]
```

**Files:**
- Create `backend/scripts/seed_companies.py`
- Add `make seed-companies` to Makefile

### Step 10: Update Auto-Apply Service

Minor changes to use `apply_url` when available:

```python
# In auto_apply_service.py, when building ApplyTask:
job_url = job.apply_url or job.url  # Prefer direct apply URL
```

**Files:**
- Edit `backend/services/auto_apply_service.py` — use `apply_url` in `ApplyTask`

### Step 11: Config Changes

Update settings to make Adzuna optional and add crawler config:

```python
# config.py additions
adzuna_app_id: str = ""          # Make optional (was required)
adzuna_api_key: str = ""         # Make optional
discovery_concurrency: int = 5   # Max companies to crawl in parallel
discovery_batch_size: int = 50   # Companies per batch
workday_request_delay: float = 1.0  # Delay between Workday requests (be polite)
```

**Files:**
- Edit `backend/config.py`

## What Stays the Same

- `models/job.py` — same table, just 2 new columns
- `services/job_matcher.py` — unchanged, scores jobs regardless of source
- `services/auto_apply_service.py` — minimal change (prefer `apply_url`)
- `services/queue_service.py` — unchanged
- `routers/auto_apply.py` — unchanged
- All apply-agents code — unchanged (receives `job_url` in `ApplyTask`, doesn't care about source)
- Full-text search — unchanged (works on title + company + description regardless of source)

## Migration Path

1. Add `companies` table and new `jobs` columns via Alembic migration
2. Deploy with both Adzuna sync and ATS crawlers available
3. Seed the company registry
4. Run first ATS crawl — new jobs appear alongside Adzuna jobs
5. Verify apply-agents work with ATS-sourced jobs (apply URLs should be direct)
6. Gradually phase out Adzuna as ATS coverage proves sufficient

## File Summary

**New files (14):**
- `backend/models/company.py`
- `backend/schemas/company.py`
- `backend/services/crawlers/__init__.py`
- `backend/services/crawlers/base.py`
- `backend/services/crawlers/greenhouse.py`
- `backend/services/crawlers/lever.py`
- `backend/services/crawlers/ashby.py`
- `backend/services/crawlers/smartrecruiters.py`
- `backend/services/crawlers/workday.py`
- `backend/services/job_discovery.py`
- `backend/routers/companies.py`
- `backend/scripts/seed_companies.py`
- `backend/tests/test_crawlers.py`
- `backend/tests/test_companies_router.py`

**Modified files (6):**
- `backend/models/job.py` — add `company_id`, `apply_url`
- `backend/schemas/job.py` — add `apply_url` to response
- `backend/config.py` — make Adzuna optional, add crawler config
- `backend/routers/jobs.py` — add filters, update sync endpoint
- `backend/services/auto_apply_service.py` — prefer `apply_url`
- `backend/main.py` — mount companies router

**Kept unchanged:**
- `backend/services/job_sync.py` — kept as optional fallback
- `backend/services/job_matcher.py` — works on jobs table regardless
- All `apply-agents` code — unchanged

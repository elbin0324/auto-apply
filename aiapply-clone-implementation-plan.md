# AIApply Clone — Full Implementation Plan

## Project Overview

A commercial SaaS platform that helps job seekers find, manage, and auto-apply to jobs using AI. The platform parses resumes, matches users to jobs, generates tailored application materials, and submits applications via headless browser agents.

**Codename:** *ApplyAgent* (placeholder)

---

## Architecture Overview

Two separate repositories with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    REPO 1: apply-platform                │
│                                                          │
│  ┌──────────────┐     ┌──────────────────────────────┐  │
│  │  Nuxt 3 SPA  │────▶│  FastAPI Backend              │  │
│  │  (Vue 3)     │     │  ├── Auth (Supabase)          │  │
│  │              │     │  ├── REST API                  │  │
│  │  Pages:      │     │  ├── Pydantic Models           │  │
│  │  - Dashboard │     │  ├── Resume Parser             │  │
│  │  - Job Board │     │  ├── Billing (Stripe)          │  │
│  │  - Profile   │     │  ├── Job Sync (Adzuna)         │  │
│  │  - Settings  │     │  └── WebSocket (status)        │  │
│  └──────────────┘     └──────────────┬───────────────┘  │
│                                       │                   │
│                              ┌────────▼────────┐         │
│                              │    Supabase      │         │
│                              │  ┌── Postgres    │         │
│                              │  ├── Auth        │         │
│                              │  ├── Storage     │         │
│                              │  └── Realtime    │         │
│                              └────────┬────────┘         │
└───────────────────────────────────────┼──────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │    Redis / BullMQ  │
                              │    (Job Queue)     │
                              └─────────┬─────────┘
                                        │
┌───────────────────────────────────────┼──────────────────┐
│                    REPO 2: apply-agents                   │
│                                        │                  │
│  ┌─────────────────────────────────────▼───────────────┐ │
│  │              Agent Worker Pool                       │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │ │
│  │  │  Orchestrator │  │  Form Filler  │  │  AI Engine│ │ │
│  │  │  (picks jobs, │  │  (headless    │  │  (Claude/ │ │ │
│  │  │   manages     │  │   browser,    │  │   GPT for │ │ │
│  │  │   workflow)   │  │   fills forms)│  │   answers)│ │ │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  Screenshot  │  │  Status       │                 │ │
│  │  │  Capture     │  │  Reporter     │                 │ │
│  │  └──────────────┘  └──────────────┘                 │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Nuxt 3 (Vue 3 Composition API) | SSR for SEO on marketing pages, SPA mode for dashboard. Your primary framework. |
| **UI Library** | Nuxt UI v3 + Tailwind CSS | Production-ready components, consistent design system |
| **Backend** | FastAPI (Python 3.12+) | Async, Pydantic-native, great for AI integrations |
| **Database** | Supabase (Postgres 15) | Auth, storage, realtime, row-level security |
| **ORM** | SQLAlchemy 2.0 + Alembic | Async support, mature migration system |
| **Queue** | Redis + BullMQ (or `arq` for Python) | Job queue between platform and agents |
| **Agent Runtime** | Python + headless browser | Separate process pool for application submission |
| **Headless Browser** | Playwright or Selenium | Browser automation for form filling |
| **AI Provider** | Anthropic Claude API (primary) | Resume parsing, cover letter gen, form field intelligence |
| **Job Data** | Adzuna API | Free tier, legitimate, good coverage |
| **Payments** | Stripe | Subscriptions + metered credits |
| **File Storage** | Supabase Storage | Resume PDFs, screenshots, generated docs |
| **Hosting** | Railway or Fly.io (API), Vercel (Nuxt) | Cost-effective for early SaaS |
| **Monitoring** | Sentry + PostHog | Error tracking + product analytics |

---

## Repo 1: `auto-apply`

### Directory Structure

```
auto-apply/
├── frontend/                    # Nuxt 3 SPA
│   ├── nuxt.config.ts
│   ├── app.vue
│   ├── pages/
│   │   ├── index.vue            # Landing / marketing page
│   │   ├── login.vue
│   │   ├── signup.vue
│   │   ├── dashboard/
│   │   │   ├── index.vue        # Overview: stats, recent activity
│   │   │   ├── jobs.vue         # Job board with search/filter
│   │   │   ├── applications.vue # Track submitted applications
│   │   │   ├── profile.vue      # Resume upload, parsed data, edit
│   │   │   ├── auto-apply.vue   # Auto-apply settings & controls
│   │   │   ├── documents.vue    # Generated resumes & cover letters
│   │   │   └── settings.vue     # Account, billing, preferences
│   │   └── pricing.vue
│   ├── components/
│   │   ├── job/
│   │   │   ├── JobCard.vue
│   │   │   ├── JobFilters.vue
│   │   │   ├── JobDetail.vue
│   │   │   └── JobMatchScore.vue
│   │   ├── profile/
│   │   │   ├── ResumeUploader.vue
│   │   │   ├── ParsedResumeView.vue
│   │   │   ├── ExperienceEditor.vue
│   │   │   └── SkillsManager.vue
│   │   ├── auto-apply/
│   │   │   ├── ApplyPreferences.vue
│   │   │   ├── ApplyQueue.vue
│   │   │   ├── ApplyStatusFeed.vue
│   │   │   └── CreditBalance.vue
│   │   ├── billing/
│   │   │   ├── PlanSelector.vue
│   │   │   ├── CreditPurchase.vue
│   │   │   └── UsageHistory.vue
│   │   └── shared/
│   │       ├── AppNav.vue
│   │       ├── AppSidebar.vue
│   │       └── StatusBadge.vue
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useJobs.ts
│   │   ├── useProfile.ts
│   │   ├── useAutoApply.ts
│   │   └── useBilling.ts
│   ├── stores/                  # Pinia stores
│   │   ├── auth.ts
│   │   ├── jobs.ts
│   │   ├── profile.ts
│   │   └── applications.ts
│   ├── middleware/
│   │   └── auth.global.ts
│   └── plugins/
│       └── supabase.client.ts
│
├── backend/                     # FastAPI
│   ├── main.py                  # App entry, CORS, lifespan
│   ├── config.py                # Settings via pydantic-settings
│   ├── deps.py                  # Dependency injection (db, auth, etc.)
│   ├── routers/
│   │   ├── auth.py              # Login, signup, OAuth callback
│   │   ├── profile.py           # CRUD profile, resume upload/parse
│   │   ├── jobs.py              # Job board listing, search, detail
│   │   ├── applications.py      # Application status, history
│   │   ├── auto_apply.py        # Auto-apply preferences, start/stop
│   │   ├── documents.py         # Generated resumes, cover letters
│   │   ├── billing.py           # Stripe webhooks, plan management
│   │   └── webhooks.py          # External service callbacks
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # SQLAlchemy User model
│   │   ├── profile.py           # Profile, experience, education, skills
│   │   ├── job.py               # Job listing model
│   │   ├── application.py       # Application tracking
│   │   ├── document.py          # Generated documents
│   │   ├── subscription.py      # Plans, credits
│   │   └── auto_apply_config.py # User auto-apply preferences
│   ├── schemas/                 # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── job.py
│   │   ├── application.py
│   │   ├── document.py
│   │   ├── billing.py
│   │   └── auto_apply.py
│   ├── services/
│   │   ├── resume_parser.py     # AI-powered resume parsing
│   │   ├── job_sync.py          # Adzuna API sync
│   │   ├── job_matcher.py       # Match score calculation
│   │   ├── document_gen.py      # Resume/cover letter generation
│   │   ├── stripe_service.py    # Billing logic
│   │   ├── queue_service.py     # Push jobs to Redis queue
│   │   └── ai_client.py        # Anthropic/OpenAI client wrapper
│   ├── db/
│   │   ├── session.py           # Async SQLAlchemy session
│   │   └── migrations/          # Alembic migrations
│   │       ├── env.py
│   │       └── versions/
│   └── utils/
│       ├── pdf_parser.py        # PDF text extraction
│       └── storage.py           # Supabase storage helpers
│
├── docker-compose.yml           # Local dev: Redis, optional Postgres
├── Makefile                     # Dev commands
├── pyproject.toml               # Python deps (Poetry)
└── README.md
```

---

## Repo 2: `apply-agents`

### Directory Structure

```
apply-agents/
├── main.py                      # Worker entry point
├── config.py                    # Settings
├── orchestrator/
│   ├── __init__.py
│   ├── job_processor.py         # Picks application jobs from queue
│   ├── workflow.py              # Full application workflow state machine
│   └── retry_handler.py         # Retry logic with exponential backoff
├── browser/
│   ├── __init__.py
│   ├── manager.py               # Browser pool management
│   ├── context.py               # Fresh browser context per application
│   ├── anti_detect.py           # Fingerprint randomization, stealth
│   └── captcha.py               # CAPTCHA detection & handling strategy
├── applicator/
│   ├── __init__.py
│   ├── base.py                  # Base applicator interface
│   ├── generic.py               # Generic form-filling applicator
│   ├── platforms/
│   │   ├── greenhouse.py        # Greenhouse ATS
│   │   ├── lever.py             # Lever ATS
│   │   ├── workday.py           # Workday
│   │   ├── taleo.py             # Taleo
│   │   ├── icims.py             # iCIMS
│   │   ├── indeed.py            # Indeed Easy Apply
│   │   └── linkedin.py          # LinkedIn Easy Apply
│   └── field_mapper.py          # AI-powered field detection & mapping
├── ai/
│   ├── __init__.py
│   ├── client.py                # AI API client
│   ├── field_analyzer.py        # Analyze form fields, determine answers
│   ├── cover_letter_gen.py      # Generate tailored cover letters
│   ├── resume_tailor.py         # Tailor resume to job description
│   └── prompts/
│       ├── field_analysis.py    # Prompt templates for form analysis
│       ├── cover_letter.py
│       └── resume_tailor.py
├── reporter/
│   ├── __init__.py
│   ├── status.py                # Report status back to platform
│   └── screenshot.py            # Capture & upload screenshots
├── models/
│   ├── __init__.py
│   ├── job_task.py              # Pydantic model for queue messages
│   ├── application_result.py    # Result of an application attempt
│   └── form_field.py            # Detected form field model
├── docker-compose.yml
├── Dockerfile                   # With browser dependencies
├── pyproject.toml
└── README.md
```

---

## Database Schema

### Core Tables

```sql
-- Supabase handles auth.users internally
-- We extend with a profiles table

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    summary TEXT,
    raw_resume_url TEXT,           -- Supabase Storage path
    parsed_resume JSONB,           -- Structured parsed data
    resume_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    start_date DATE,
    end_date DATE,                 -- NULL = current
    description TEXT,
    bullets JSONB,                 -- Array of bullet points
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    gpa TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,                 -- 'technical', 'soft', 'language', 'tool'
    proficiency TEXT,              -- 'beginner', 'intermediate', 'advanced', 'expert'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE,       -- Adzuna job ID
    title TEXT NOT NULL,
    company TEXT,
    company_logo_url TEXT,
    location TEXT,
    location_type TEXT,            -- 'remote', 'hybrid', 'onsite'
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_currency TEXT DEFAULT 'CAD',
    description TEXT,
    requirements JSONB,            -- Parsed requirements
    url TEXT NOT NULL,              -- Original job posting URL
    source TEXT DEFAULT 'adzuna',
    category TEXT,
    tags JSONB,                    -- Array of tags/keywords
    posted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_search ON jobs USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(description, ''))
);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = TRUE;

CREATE TABLE auto_apply_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    target_titles JSONB,           -- ["Software Engineer", "Full Stack Developer"]
    target_locations JSONB,        -- ["Toronto, ON", "Remote"]
    min_salary NUMERIC,
    max_salary NUMERIC,
    excluded_companies JSONB,      -- ["Company A", "Company B"]
    preferred_industries JSONB,
    location_type_pref JSONB,      -- ["remote", "hybrid"]
    experience_level TEXT,         -- 'entry', 'mid', 'senior', 'lead'
    daily_apply_limit INT DEFAULT 25,
    require_review BOOLEAN DEFAULT FALSE, -- If true, queue for user review before applying
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    status TEXT NOT NULL DEFAULT 'queued',
        -- 'queued', 'pending_review', 'in_progress', 'applied',
        -- 'failed', 'skipped', 'withdrawn'
    applied_at TIMESTAMPTZ,
    resume_used_url TEXT,          -- Tailored resume used
    cover_letter_used TEXT,        -- Generated cover letter
    screenshot_url TEXT,           -- Confirmation screenshot
    error_message TEXT,
    metadata JSONB,                -- ATS platform detected, form fields, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_user ON applications(user_id, created_at DESC);
CREATE INDEX idx_applications_status ON applications(status);

CREATE TABLE generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    doc_type TEXT NOT NULL,        -- 'resume', 'cover_letter'
    content TEXT,                  -- Raw text content
    file_url TEXT,                 -- Storage path for PDF
    match_score NUMERIC,           -- AI-computed match percentage
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free',  -- 'free', 'pro', 'premium'
    status TEXT NOT NULL DEFAULT 'active',
    credits_remaining INT DEFAULT 0,
    credits_used_total INT DEFAULT 0,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INT NOT NULL,           -- Positive = add, negative = consume
    reason TEXT,                   -- 'subscription_renewal', 'credit_purchase', 'application_sent'
    reference_id UUID,             -- Link to application or purchase
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Pydantic Schemas (Key Examples)

```python
# backend/schemas/profile.py
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from uuid import UUID

class ExperienceCreate(BaseModel):
    company: str
    title: str
    location: str | None = None
    start_date: date
    end_date: date | None = None
    description: str | None = None
    bullets: list[str] = []

class EducationCreate(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    gpa: str | None = None

class SkillCreate(BaseModel):
    name: str
    category: str = "technical"
    proficiency: str = "intermediate"

class ProfileResponse(BaseModel):
    id: UUID
    full_name: str | None
    email: str | None
    phone: str | None
    location: str | None
    linkedin_url: str | None
    summary: str | None
    experiences: list[ExperienceCreate] = []
    educations: list[EducationCreate] = []
    skills: list[SkillCreate] = []

class ParsedResume(BaseModel):
    """Structured output from AI resume parsing"""
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    summary: str | None = None
    experiences: list[ExperienceCreate] = []
    educations: list[EducationCreate] = []
    skills: list[SkillCreate] = []
    raw_text: str = ""


# backend/schemas/job.py
class JobSearchParams(BaseModel):
    query: str | None = None
    location: str | None = None
    location_type: list[str] | None = None  # remote, hybrid, onsite
    salary_min: float | None = None
    category: str | None = None
    page: int = 1
    per_page: int = 20
    sort_by: str = "posted_at"  # posted_at, match_score, salary

class JobResponse(BaseModel):
    id: UUID
    title: str
    company: str | None
    company_logo_url: str | None
    location: str | None
    location_type: str | None
    salary_min: float | None
    salary_max: float | None
    description: str | None
    tags: list[str] = []
    url: str
    posted_at: str | None
    match_score: float | None = None  # Computed per-user

class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    per_page: int


# backend/schemas/auto_apply.py
class AutoApplyConfig(BaseModel):
    is_active: bool = False
    target_titles: list[str] = []
    target_locations: list[str] = []
    min_salary: float | None = None
    max_salary: float | None = None
    excluded_companies: list[str] = []
    preferred_industries: list[str] = []
    location_type_pref: list[str] = ["remote", "hybrid"]
    experience_level: str = "mid"
    daily_apply_limit: int = 25
    require_review: bool = False

class ApplicationStatus(BaseModel):
    id: UUID
    job_title: str
    company: str
    status: str
    applied_at: str | None
    screenshot_url: str | None
    error_message: str | None


# backend/schemas/billing.py
class PlanInfo(BaseModel):
    plan: str
    credits_remaining: int
    credits_used_total: int
    current_period_end: str | None

class CreditPurchase(BaseModel):
    quantity: int = Field(ge=10, le=500)
    # 10 credits = $10, 50 = $40, 100 = $60, 250 = $120
```

---

## Queue Contract (Between Repos)

The platform pushes tasks to Redis, and agents consume them.

```python
# Shared schema (can be a small shared package or duplicated)
from pydantic import BaseModel
from uuid import UUID

class ApplyTask(BaseModel):
    """Message pushed to Redis queue by platform, consumed by agents"""
    task_id: UUID
    application_id: UUID
    user_id: UUID
    job_url: str
    job_title: str
    company: str

    # User profile data needed for form filling
    profile: dict          # Full parsed profile
    resume_url: str        # Supabase storage URL for resume PDF
    cover_letter: str      # Pre-generated cover letter text
    tailored_resume: dict | None = None  # Tailored resume data if generated

    # Preferences
    require_screenshot: bool = True
    max_retries: int = 2
    priority: int = 5      # 1=highest, 10=lowest

class ApplyResult(BaseModel):
    """Result pushed back by agent"""
    task_id: UUID
    application_id: UUID
    status: str            # 'applied', 'failed', 'skipped', 'needs_captcha'
    screenshot_url: str | None = None
    error_message: str | None = None
    ats_platform: str | None = None  # Detected ATS: greenhouse, lever, etc.
    fields_filled: dict | None = None  # Record of what was filled
    duration_seconds: float | None = None
```

---

## Key API Endpoints

### Auth
```
POST   /api/auth/signup              # Email/password registration
POST   /api/auth/login               # Email/password login
POST   /api/auth/oauth/google        # Google OAuth initiate
GET    /api/auth/oauth/callback      # OAuth callback
POST   /api/auth/logout
GET    /api/auth/me                  # Current user info
```

### Profile
```
GET    /api/profile                  # Get current user profile
PUT    /api/profile                  # Update profile fields
POST   /api/profile/resume/upload    # Upload resume PDF
POST   /api/profile/resume/parse     # Trigger AI parsing of uploaded resume
GET    /api/profile/resume/parsed    # Get parsed resume data
PUT    /api/profile/experiences      # Bulk update experiences
PUT    /api/profile/education        # Bulk update education
PUT    /api/profile/skills           # Bulk update skills
```

### Jobs
```
GET    /api/jobs                     # Search/list jobs (with filters)
GET    /api/jobs/:id                 # Job detail
GET    /api/jobs/:id/match           # Get match score for current user
POST   /api/jobs/sync                # Admin: trigger Adzuna sync
```

### Auto-Apply
```
GET    /api/auto-apply/config        # Get auto-apply settings
PUT    /api/auto-apply/config        # Update settings
POST   /api/auto-apply/start         # Activate auto-apply
POST   /api/auto-apply/stop          # Deactivate
GET    /api/auto-apply/queue         # Current queue status
POST   /api/auto-apply/review/:id    # Approve/reject pending application
```

### Applications
```
GET    /api/applications             # List all applications (paginated)
GET    /api/applications/:id         # Application detail with screenshot
GET    /api/applications/stats       # Aggregate stats (applied, pending, etc.)
```

### Documents
```
POST   /api/documents/cover-letter   # Generate cover letter for a job
POST   /api/documents/resume/tailor  # Tailor resume for a job
GET    /api/documents                # List generated documents
GET    /api/documents/:id/download   # Download PDF
```

### Billing
```
GET    /api/billing/plan             # Current plan & credit balance
POST   /api/billing/checkout         # Create Stripe checkout session
POST   /api/billing/credits/purchase # Purchase additional credits
POST   /api/billing/webhooks/stripe  # Stripe webhook handler
GET    /api/billing/history          # Transaction history
POST   /api/billing/portal           # Stripe customer portal session
```

---

## Agent Worker Design (Repo 2)

### Application Workflow State Machine

```
                    ┌──────────┐
                    │  QUEUED   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ STARTING │  Pick up task, launch browser
                    └────┬─────┘
                         │
                    ┌────▼──────────┐
                    │ NAVIGATING    │  Go to job URL
                    └────┬──────────┘
                         │
                    ┌────▼──────────┐
                    │ DETECTING ATS │  Identify form platform
                    └────┬──────────┘
                         │
              ┌──────────┼───────────┐
              ▼          ▼           ▼
        ┌──────────┐ ┌────────┐ ┌────────┐
        │Greenhouse│ │ Lever  │ │Generic │  Platform-specific handlers
        └────┬─────┘ └───┬────┘ └───┬────┘
              └──────────┼──────────┘
                         │
                    ┌────▼──────────┐
                    │ FILLING FORM  │  AI analyzes fields → fills answers
                    └────┬──────────┘
                         │
                    ┌────▼──────────┐
                    │ REVIEWING     │  Validate all required fields filled
                    └────┬──────────┘
                         │
                    ┌────▼──────────┐
                    │ SUBMITTING    │  Click submit, capture screenshot
                    └────┬──────────┘
                         │
              ┌──────────┼───────────┐
              ▼                      ▼
        ┌──────────┐          ┌──────────┐
        │ APPLIED  │          │  FAILED  │
        └──────────┘          └──────────┘
```

### ATS Platform Detection

```python
# apply-agents/applicator/field_mapper.py

ATS_SIGNATURES = {
    "greenhouse": [
        "boards.greenhouse.io",
        "grnh.se",
        'id="grnhse_app"',
    ],
    "lever": [
        "jobs.lever.co",
        "lever-jobs-iframe",
    ],
    "workday": [
        "myworkdayjobs.com",
        "wd5.myworkdayjobs.com",
    ],
    "icims": [
        "icims.com",
        "careers-icims",
    ],
    "taleo": [
        "taleo.net",
        "oracle.taleo",
    ],
    "indeed": [
        "indeed.com/applystart",
        "indeedapply",
    ],
    "linkedin": [
        "linkedin.com/jobs",
        "easy-apply",
    ],
}

def detect_ats(url: str, page_source: str) -> str:
    """Detect ATS platform from URL and page source"""
    for platform, signatures in ATS_SIGNATURES.items():
        for sig in signatures:
            if sig in url or sig in page_source:
                return platform
    return "generic"
```

### AI-Powered Form Filling

```python
# apply-agents/ai/field_analyzer.py

FIELD_ANALYSIS_PROMPT = """
You are analyzing a job application form. Given the form fields detected
on the page and the applicant's profile, determine the correct value
for each field.

Form fields detected:
{fields_json}

Applicant profile:
{profile_json}

Job title: {job_title}
Company: {company}

For each field, return a JSON object with:
- field_id: the field identifier
- value: the value to fill in
- confidence: 0-1 how confident you are
- reasoning: brief explanation

For fields you cannot determine (e.g., "How did you hear about us?"),
use reasonable defaults. For salary expectations, use the applicant's
preferences. For "Are you authorized to work in [country]?" type
questions, answer based on the applicant's location.

Return ONLY valid JSON array.
"""
```

---

## Adzuna Job Sync Service

```python
# backend/services/job_sync.py

import httpx
from config import settings

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"

async def sync_jobs(
    country: str = "ca",  # Canada
    category: str = "it-jobs",
    pages: int = 5,
    results_per_page: int = 50,
) -> int:
    """
    Sync jobs from Adzuna API into local database.
    Run on a schedule (e.g., every 6 hours via cron or scheduler).
    """
    total_synced = 0

    async with httpx.AsyncClient() as client:
        for page in range(1, pages + 1):
            response = await client.get(
                f"{ADZUNA_BASE}/{country}/search/{page}",
                params={
                    "app_id": settings.ADZUNA_APP_ID,
                    "app_key": settings.ADZUNA_API_KEY,
                    "results_per_page": results_per_page,
                    "category": category,
                    "content-type": "application/json",
                    "sort_by": "date",
                },
            )
            data = response.json()

            for result in data.get("results", []):
                # Upsert into jobs table
                await upsert_job(
                    external_id=result["id"],
                    title=result.get("title"),
                    company=result.get("company", {}).get("display_name"),
                    location=result.get("location", {}).get("display_name"),
                    description=result.get("description"),
                    url=result.get("redirect_url"),
                    salary_min=result.get("salary_min"),
                    salary_max=result.get("salary_max"),
                    posted_at=result.get("created"),
                    category=result.get("category", {}).get("label"),
                    tags=result.get("category", {}).get("tag"),
                )
                total_synced += 1

    return total_synced
```

---

## Phased Development Plan

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Monorepo scaffold, auth, profile, resume upload/parse

| Task | Effort | Details |
|------|--------|---------|
| Init Nuxt 3 project with Nuxt UI + Tailwind | 2h | Frontend scaffold |
| Init FastAPI project with Poetry | 1h | Backend scaffold |
| Supabase project setup | 1h | Auth providers, storage buckets, DB |
| SQLAlchemy models + Alembic migrations | 4h | All core tables |
| Pydantic schemas (all request/response) | 3h | Strict validation |
| Auth flow (email + Google OAuth) | 6h | Supabase auth integration both sides |
| Profile CRUD API | 4h | Full profile management |
| Resume upload to Supabase Storage | 2h | PDF upload, URL storage |
| AI resume parser service | 6h | PDF → text → Claude → ParsedResume |
| Profile editing UI (experiences, skills, education) | 8h | Vue components with inline editing |
| Resume uploader component | 3h | Drag-drop, progress, preview |
| Dashboard layout + navigation | 4h | Sidebar, responsive layout |
| **Total** | **~44h** | |

### Phase 2: Job Board (Weeks 4-5)

**Goal:** Adzuna integration, job search, match scoring

| Task | Effort | Details |
|------|--------|---------|
| Adzuna API integration service | 4h | Sync, upsert, scheduling |
| Job search API with full-text search | 4h | Postgres FTS, filters |
| Job match scoring service | 6h | AI-powered profile↔job matching |
| Job board page with filters | 8h | Search, filter, pagination, cards |
| Job detail page | 4h | Full description, match score, apply CTA |
| Scheduled job sync (cron) | 2h | APScheduler or Celery beat |
| **Total** | **~28h** | |

### Phase 3: Auto-Apply Core (Weeks 6-9)

**Goal:** Auto-apply config, queue, agent worker MVP

| Task | Effort | Details |
|------|--------|---------|
| Auto-apply config API | 3h | CRUD preferences |
| Auto-apply settings UI | 6h | Form builder for preferences |
| Redis queue setup + BullMQ/arq | 4h | Queue infrastructure |
| Queue service (platform → Redis) | 4h | Job matching → task creation |
| Agent repo scaffold | 2h | Project structure, Docker |
| Browser manager (pool, contexts) | 8h | Playwright/Selenium setup |
| ATS platform detection | 4h | URL + DOM signature matching |
| Generic form filler | 16h | AI field analysis + form interaction |
| Greenhouse applicator | 8h | Platform-specific handler |
| Lever applicator | 6h | Platform-specific handler |
| Screenshot capture + upload | 3h | Confirmation evidence |
| Status reporter (agent → platform) | 4h | Update application status via API/queue |
| Application tracking UI | 8h | Status feed, screenshots, stats |
| **Total** | **~76h** | |

### Phase 4: Billing & Polish (Weeks 10-12)

**Goal:** Monetization, credit system, production hardening

| Task | Effort | Details |
|------|--------|---------|
| Stripe integration (subscriptions) | 8h | Checkout, webhooks, portal |
| Credit system (purchase + consume) | 6h | Transaction tracking |
| Billing UI (plans, credits, history) | 6h | Plan selector, usage dashboard |
| Rate limiting + credit enforcement | 4h | Middleware |
| Error handling + retry logic (agents) | 6h | Exponential backoff, dead letter |
| Anti-detection (browser fingerprinting) | 6h | Stealth mode for agents |
| Dashboard overview page | 4h | Stats, charts, recent activity |
| Email notifications | 4h | Application status, credit low |
| Landing page + pricing page | 8h | Marketing / conversion |
| **Total** | **~52h** | |

### Phase 5: Scale & Harden (Weeks 13-16)

| Task | Effort | Details |
|------|--------|---------|
| Workday applicator | 10h | Complex multi-step forms |
| Indeed Easy Apply applicator | 6h | |
| LinkedIn Easy Apply applicator | 8h | |
| CAPTCHA handling strategy | 8h | Detection, 2captcha/hCaptcha solver |
| Load testing agent pool | 4h | Concurrent browser management |
| Monitoring + alerting (Sentry) | 4h | |
| Product analytics (PostHog) | 3h | Funnels, feature usage |
| User onboarding flow | 6h | Guided setup wizard |
| **Total** | **~49h** | |

---

## Deployment Architecture

```
┌─────────────────────────────────┐
│           Vercel                 │
│  ┌───────────────────────────┐  │
│  │     Nuxt 3 Frontend       │  │
│  │     (SSR + SPA hybrid)    │  │
│  └───────────────────────────┘  │
└──────────────┬──────────────────┘
               │ API calls
┌──────────────▼──────────────────┐
│      Railway / Fly.io            │
│  ┌───────────────────────────┐  │
│  │     FastAPI Backend        │  │
│  │     (2+ instances)         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     Redis                  │  │
│  └───────────────────────────┘  │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      Dedicated VPS / Railway     │
│  ┌───────────────────────────┐  │
│  │  Agent Workers (Docker)    │  │
│  │  - Playwright + Chromium   │  │
│  │  - 2-4 concurrent          │  │
│  │  - Auto-scaling            │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
               │
┌──────────────▼──────────────────┐
│          Supabase                │
│  ├── Postgres                    │
│  ├── Auth                        │
│  ├── Storage (resumes, screens)  │
│  └── Realtime (status updates)   │
└─────────────────────────────────┘
```

---

## Pricing Model (Suggested)

| Plan | Monthly | Features |
|------|---------|----------|
| **Free** | $0 | Job board access, 3 resume parses, 1 cover letter/day |
| **Pro** | $19/mo ($15/mo annual) | Unlimited parsing, unlimited cover letters, resume scanner, 25 auto-apply credits/mo |
| **Premium** | $39/mo ($29/mo annual) | Everything in Pro + 100 auto-apply credits/mo + priority queue |
| **Credit Packs** | $10-$120 | 10 ($10), 50 ($40), 100 ($60), 250 ($120) — add-on to any plan |

---

## Environment Variables

```bash
# Platform (.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://localhost:6379
ADZUNA_APP_ID=xxx
ADZUNA_API_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Agents (.env)
REDIS_URL=redis://...
PLATFORM_API_URL=https://api.yourdomain.com
PLATFORM_API_KEY=internal-secret-key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
BROWSER_POOL_SIZE=4
HEADLESS=true
```

---

## Key Technical Decisions & Rationale

1. **Two repos, not a monolith:** Agents need heavy browser deps (Chromium ~400MB), different scaling characteristics, and independent deployment. The platform is a lightweight API; agents are resource-intensive workers.

2. **Supabase over raw Postgres:** Gets you auth, storage, and realtime for free. You can still use SQLAlchemy for the ORM layer and bypass the Supabase client for DB operations if you prefer raw SQL performance.

3. **Redis queue over Supabase Realtime for task dispatch:** Reliable message delivery with retries, dead letter queues, and backpressure. Supabase Realtime is great for pushing status updates *to the frontend* but not for critical task orchestration.

4. **Platform-specific ATS handlers:** Generic form filling works ~60% of the time. Purpose-built handlers for Greenhouse, Lever, Workday (the top 3 ATS platforms) dramatically improve success rates. Generic handler as fallback.

5. **AI for form field analysis:** Instead of brittle CSS selectors, use Claude to analyze the DOM/form structure and determine what each field expects. This is the key differentiator from simple bots.

6. **Credit system on top of subscription:** Mirrors AIApply's model and aligns incentives — users pay base for tools, pay per-application for the expensive part (agent compute + AI tokens).

---

## Risk Factors & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Job boards blocking automated applications | High | Rotate IPs, realistic browser fingerprints, rate limiting, residential proxies |
| ATS form changes breaking applicators | Medium | AI-powered field analysis as fallback, monitoring for failures, quick patch cycle |
| CAPTCHA on application forms | Medium | 2captcha/hCaptcha solver integration, skip + notify user strategy |
| Adzuna API rate limits / data quality | Low | Cache aggressively, add secondary sources later |
| AI hallucination in form filling | Medium | Confidence thresholds, validation step before submit, screenshot evidence |
| Stripe billing edge cases | Low | Use Stripe's hosted checkout + customer portal to minimize custom billing code |

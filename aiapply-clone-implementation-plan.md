# ApplyAgent — Unified Implementation Plan

> **Last Updated:** 2026-02-27
> **Audited From:** Actual code in both repositories (not prior markdown docs)

## Project Overview

A commercial SaaS platform that helps job seekers find, manage, and auto-apply to jobs using AI. The platform parses resumes, matches users to jobs, generates tailored application materials, and submits applications via headless browser agents.

**Two repositories:**

| Repo | Purpose | Location |
|------|---------|----------|
| `auto-apply` | Platform — FastAPI backend + Nuxt 3 frontend | Repo 1 |
| `apply-agents` | Agent workers — headless browser + Claude AI | Repo 2 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    REPO 1: auto-apply                    │
│                                                          │
│  ┌──────────────┐     ┌──────────────────────────────┐  │
│  │  Nuxt 3 SPA  │────▶│  FastAPI Backend              │  │
│  │  (Vue 3)     │     │  ├── Auth (Supabase JWT)      │  │
│  │              │     │  ├── REST API (7 routers)      │  │
│  │  NOT STARTED │     │  ├── Resume Parser (Claude)    │  │
│  │              │     │  ├── Job Sync (Adzuna)         │  │
│  │              │     │  ├── Auto-Apply Config         │  │
│  │              │     │  └── Queue Service (Redis)     │  │
│  └──────────────┘     └──────────────┬───────────────┘  │
│                                       │                   │
│                              ┌────────▼────────┐         │
│                              │    Supabase      │         │
│                              │  ├── Postgres 15 │         │
│                              │  ├── Auth        │         │
│                              │  └── Storage     │         │
│                              └────────┬────────┘         │
└───────────────────────────────────────┼──────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │    Redis 7         │
                              │    RPUSH / LPOP    │
                              │    auto_apply:tasks│
                              └─────────┬─────────┘
                                        │
┌───────────────────────────────────────┼──────────────────┐
│                    REPO 2: apply-agents                   │
│                                        │                  │
│  ┌─────────────────────────────────────▼───────────────┐ │
│  │              Agent Worker Pool                       │ │
│  │                                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │ │
│  │  │  Orchestrator │  │ Browser Agent│  │Application│ │ │
│  │  │  (job_proc,  │  │ (Claude tool │  │  Agent    │ │ │
│  │  │   workflow)  │  │  use loop)   │  │ (answers) │ │ │
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
| **Backend** | FastAPI (Python 3.12+) | Async, Pydantic-native, AI integrations |
| **ORM** | SQLAlchemy 2.0 async + Alembic | Full async, mature migrations |
| **Database** | Supabase (Postgres 15) | Auth, storage, RLS |
| **Auth** | Supabase Auth (JWT verification) | No custom auth system |
| **Queue** | Redis 7 (RPUSH/LPOP, `redis.asyncio`) | Simple, reliable task dispatch |
| **Agent Runtime** | Python 3.12+ + Playwright (Chromium) | Two-agent Claude tool-use architecture |
| **AI Provider** | Anthropic Claude (`claude-sonnet-4-6`) | Resume parsing, form filling, cover letters |
| **Job Data** | Adzuna API | Free tier, Canadian IT jobs |
| **Payments** | Stripe | Subscriptions + metered credits |
| **File Storage** | Supabase Storage | Resumes, screenshots |
| **Frontend** | Nuxt 3 (Vue 3) + Nuxt UI v3 | SSR + SPA hybrid |
| **PDF Parsing** | pdfplumber | Pure Python, no system deps |

---

## Implementation Status (Code-Audited 2026-02-27)

### auto-apply (Platform — Repo 1)

| Phase | Name | Status | Tests | Key Files |
|-------|------|--------|-------|-----------|
| 1 | Project Scaffold | **DONE** | 3 | `main.py`, `config.py`, `deps.py` |
| 2 | DB Models & Migrations | **DONE** | — | 11 models, 3 migrations |
| 3 | Pydantic Schemas | **DONE** | — | 33 schemas across 7 files |
| 4 | Auth (Supabase JWT) | **DONE** | 3 | `routers/auth.py` (6 endpoints) |
| 5 | Profile API | **DONE** | 17 | `routers/profile.py` (10 endpoints) |
| 6 | Jobs & Adzuna Sync | **DONE** | 26 | `routers/jobs.py`, `job_sync.py`, `job_matcher.py` |
| 7 | Auto-Apply Config | **DONE** | 30 | `routers/auto_apply.py`, `auto_apply_service.py`, `queue_service.py` |
| 8 | Applications API | **DONE** | 23 | `routers/applications.py`, `application_service.py` |
| 9 | Document Generation | **NOT STARTED** | — | — |
| 10 | Billing & Stripe | **NOT STARTED** | — | Credit check stub returns -1 |
| 11 | Hardening & Production | **NOT STARTED** | — | — |
| — | Frontend (Nuxt 3) | **NOT STARTED** | — | Empty `/frontend/` directory |

**Totals:** 8/11 backend phases complete. 108 tests passing. ~3,800 lines production code. Frontend is empty.

### apply-agents (Workers — Repo 2)

| Phase | Name | Status | Tests | Key Files |
|-------|------|--------|-------|-----------|
| 1 | Scaffold & Config | **DONE** | 5 | `main.py`, `config.py`, models/ |
| 2 | Browser Automation | **DONE** | 34 | browser/ (manager, context, tools, page_analyzer, anti_detect, captcha, cookie_banner) |
| 3 | AI Agents | **DONE** | 19 | agents/ (browser_agent, application_agent), ai/ (client, prompts) |
| 4 | Orchestration | **DONE** | 5 | orchestrator/ (job_processor, workflow, retry_handler) |
| 5 | Reporter & Screenshot | **DONE** | 12 | reporter/ (status, screenshot) |
| 6 | Hardening | **DONE** | — | Dockerfile, Makefile, startup validation, graceful shutdown |

**Totals:** 6/6 phases complete. 75 tests passing. ~4,300 lines production code. Production-ready.

---

## Integration Contract

### Queue Protocol

| Direction | Medium | Key / Endpoint | Auth |
|-----------|--------|----------------|------|
| Platform → Agent | Redis RPUSH | `auto_apply:tasks` | Direct Redis connection |
| Agent → Platform | HTTP POST | `{PLATFORM_API_URL}/api/internal/applications/result` | `X-Internal-API-Key` header |

### ApplyTask (Platform pushes, Agent consumes)

```python
class ApplyTask(BaseModel):
    application_id: UUID       # Correlation ID
    user_id: UUID
    job_id: UUID
    job_url: str               # Agent navigates here
    resume_url: str | None     # Pre-signed Supabase Storage URL
    resume_text: str | None    # Raw resume text
    cover_letter: str | None   # Pre-generated cover letter
    user_profile: UserProfileForAgent | None
```

### ApplyResult (Agent posts back to Platform)

```python
class ApplyResult(BaseModel):
    application_id: UUID       # Must match task
    success: bool
    screenshot_url: str | None # Supabase Storage URL
    error_message: str | None
    metadata: dict = {}        # fields_filled, agent_turns, duration, tokens, cost
```

### UserProfileForAgent (Nested in ApplyTask)

```python
class UserProfileForAgent(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    summary: str | None = None
    experiences: list[ExperienceForAgent] = []
    educations: list[EducationForAgent] = []
    skills: list[SkillForAgent] = []
    application_preferences: ApplicationPreferences | None = None
```

---

## Known Integration Gaps (Must Fix Before E2E)

These are verified mismatches between the two repos as of 2026-02-27:

### GAP 1: Missing Result Endpoint (CRITICAL)

**Problem:** `apply-agents` POSTs results to `POST /api/internal/applications/result`, but this endpoint **does not exist** in `auto-apply`. The auto-apply router (`routers/auto_apply.py`) has no handler for incoming agent results.

**Fix:** Create `POST /api/internal/applications/result` in auto-apply that:
- Accepts `ApplyResult` body
- Authenticates via internal API key
- Updates the `applications` table (status, screenshot_url, error_message, metadata, applied_at)
- Returns 200 OK

### GAP 2: Auth Header Mismatch (CRITICAL)

**Problem:** `apply-agents` sends results with `X-Internal-API-Key` custom header, but `auto-apply`'s `verify_internal_api_key` dependency expects `Authorization: Bearer {key}` (via FastAPI's `HTTPBearer()`).

**Fix:** Either:
- **Option A (recommended):** Change `auto-apply`'s internal key verification to read `X-Internal-API-Key` header directly instead of using `HTTPBearer()`
- **Option B:** Change `apply-agents` to send `Authorization: Bearer {key}` instead

### GAP 3: Nested Type Name Mismatch (MEDIUM)

**Problem:** `auto-apply` serializes profile data using `ExperienceCreate`, `EducationCreate`, `SkillCreate` class names. `apply-agents` deserializes into `ExperienceForAgent`, `EducationForAgent`, `SkillForAgent`. The **field structures are identical** so JSON serialization works, but the naming inconsistency makes the codebase harder to maintain.

**Fix:** Rename the classes in `auto-apply` schemas to `ExperienceForAgent`, etc., or create dedicated `ForAgent` aliases. Since Pydantic serializes to plain JSON (class names aren't in the wire format), this works today but should be cleaned up.

### GAP 4: Applications API Not Built (BLOCKING)

**Problem:** Phase 8 (Applications API) is not started. This means:
- No `GET /api/applications` for users to see their application history
- No `GET /api/applications/{id}` for application detail
- No `GET /api/applications/stats` for dashboard aggregates
- The internal result endpoint (GAP 1) has no router to live in

**Fix:** Implement Phase 8. The result endpoint can live in a new `routers/applications.py` or in `routers/auto_apply.py`.

---

## Database Schema

### Tables (11 — all created, 3 migrations applied)

```sql
-- Mirrors Supabase auth.users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    supabase_uid TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT, email TEXT, phone TEXT, location TEXT,
    linkedin_url TEXT, website_url TEXT, summary TEXT,
    raw_resume_url TEXT,
    parsed_resume JSONB,
    resume_updated_at TIMESTAMPTZ,
    application_preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE experiences (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company TEXT NOT NULL, title TEXT NOT NULL, location TEXT,
    start_date DATE, end_date DATE, description TEXT,
    bullets JSONB, sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE educations (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution TEXT NOT NULL, degree TEXT, field_of_study TEXT,
    start_date DATE, end_date DATE, gpa TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, category TEXT, proficiency TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    external_id TEXT UNIQUE,
    title TEXT NOT NULL, company TEXT, company_logo_url TEXT,
    location TEXT, location_type TEXT,
    salary_min NUMERIC, salary_max NUMERIC, salary_currency TEXT DEFAULT 'CAD',
    description TEXT, requirements JSONB, url TEXT NOT NULL,
    source TEXT DEFAULT 'adzuna', category TEXT, tags JSONB,
    posted_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- GIN index on title + company + description for FTS

CREATE TABLE job_match_scores (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL, factors JSONB,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE TABLE auto_apply_configs (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    target_titles JSONB, target_locations JSONB,
    min_salary NUMERIC, max_salary NUMERIC,
    excluded_companies JSONB, preferred_industries JSONB,
    location_type_pref JSONB, experience_level TEXT,
    daily_apply_limit INT DEFAULT 25,
    require_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    status TEXT NOT NULL DEFAULT 'queued',
    applied_at TIMESTAMPTZ,
    resume_used_url TEXT, cover_letter_used TEXT,
    screenshot_url TEXT, error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_documents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    doc_type TEXT NOT NULL, content TEXT, file_url TEXT,
    match_score NUMERIC, metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT, stripe_subscription_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    credits_remaining INT DEFAULT 0,
    credits_used_total INT DEFAULT 0,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason TEXT, reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Implemented (auto-apply backend)

```
# Health
GET    /api/health                         → {"status": "ok", "version": "0.1.0"}

# Auth (Phase 4)
POST   /api/auth/signup                    → Create Supabase user + local row
POST   /api/auth/login                     → Email/password → JWT
POST   /api/auth/oauth/google              → Supabase OAuth URL
GET    /api/auth/oauth/callback            → Handle callback, return token
POST   /api/auth/logout                    → Revoke session
GET    /api/auth/me                        → Current user info

# Profile (Phase 5)
GET    /api/profile                        → Full profile (auto-creates)
PUT    /api/profile                        → Update fields
PUT    /api/profile/experiences            → Bulk replace
PUT    /api/profile/education              → Bulk replace
PUT    /api/profile/skills                 → Bulk replace
GET    /api/profile/preferences            → Application screening Q&A
PUT    /api/profile/preferences            → Set/merge preferences
POST   /api/profile/resume/upload          → PDF to Supabase Storage
POST   /api/profile/resume/parse           → PDF → Claude → structured JSON
GET    /api/profile/resume/parsed          → Get parsed resume

# Jobs (Phase 6)
GET    /api/jobs                           → FTS search + filters + pagination
GET    /api/jobs/{id}                      → Job detail with match score
GET    /api/jobs/{id}/match                → Match score details
POST   /api/jobs/sync                      → Adzuna sync (internal API key)

# Auto-Apply (Phase 7)
GET    /api/auto-apply/config              → Get config (auto-creates)
PUT    /api/auto-apply/config              → Update preferences
POST   /api/auto-apply/start              → Activate + match + push to queue
POST   /api/auto-apply/stop               → Deactivate + mark pending as skipped
GET    /api/auto-apply/queue              → Queue depth + pending count
POST   /api/auto-apply/review/{id}        → Approve/reject pending application
```

### Not Yet Implemented

```
# Applications (Phase 8) — NOT STARTED
GET    /api/applications                   → List applications (paginated, filtered)
GET    /api/applications/{id}              → Application detail with screenshot
GET    /api/applications/stats             → Aggregate stats
POST   /api/internal/applications/result   → Agent result callback (internal key)

# Documents (Phase 9) — NOT STARTED
POST   /api/documents/cover-letter         → Generate cover letter for job
POST   /api/documents/resume/tailor        → Tailor resume for job
GET    /api/documents                      → List generated documents
GET    /api/documents/{id}/download        → Download PDF

# Billing (Phase 10) — NOT STARTED
GET    /api/billing/plan                   → Current plan & credits
POST   /api/billing/checkout               → Create Stripe checkout session
POST   /api/billing/credits/purchase       → Purchase additional credits
POST   /api/billing/webhooks/stripe        → Stripe webhook handler
GET    /api/billing/history                → Transaction history
POST   /api/billing/portal                 → Stripe customer portal
```

---

## Agent Worker Architecture (apply-agents — COMPLETE)

```
main.py (poll Redis via LPOP)
  └─→ job_processor.process_task(task, browser_pool)
      ├─ Acquire browser from pool
      ├─ Create isolated context (randomized fingerprint)
      ├─ Download resume to temp file
      ├─ Navigate to job_url
      ├─ Dismiss cookie banners & popups
      ├─ Pre-flight: CAPTCHA detection, login wall detection
      └─ BrowserAgent.run()
           │  Claude tool-use conversation loop (max 50 turns):
           │  get_page_info() → Claude reasons → execute tool → repeat
           │
           │  Tools (9):
           │    get_page_info, take_screenshot, click, fill_field,
           │    select_option, upload_file, scroll,
           │    ask_application_agent, mark_complete
           │
           └─ ask_application_agent → ApplicationAgent.answer()
                 │  Single Claude call with full profile context
                 │  Returns: { value, confidence, reasoning }
                 │  Confidence < 0.6 → skip field
                 └─ Can trigger cover letter generation on demand
      ├─ Upload screenshot to Supabase
      ├─ Calculate token usage + cost estimate
      ├─ POST ApplyResult to platform API
      └─ Clean up (close context, return browser, delete temp resume)
```

### Agent Features (All Implemented)

- Browser pool with acquire/release (configurable size)
- Per-task browser context with randomized viewport, locale, timezone, user-agent
- 5 WebDriver stealth patches + 14 tracker domains blocked
- CAPTCHA detection (reCAPTCHA, hCaptcha, Cloudflare Turnstile)
- Login wall detection
- Cookie banner/popup dismissal (35+ selectors)
- Keystroke-by-keystroke typing with realistic delays (30-100ms)
- Interaction delays between actions (500-2000ms)
- Conversation context trimming (sliding screenshot window, message limit)
- Token tracking and cost estimation (Sonnet pricing)
- Graceful shutdown on SIGINT/SIGTERM
- Startup validation (fails fast on missing env vars)
- Dockerfile with multi-stage build (Playwright + Chromium)

---

## Remaining Work — Unified Roadmap

### PHASE A: Integration Bridge (Priority 1 — Unblocks E2E)

These tasks connect the two repos so they can work together end-to-end.

- [ ] **A.1** Fix internal API key auth mismatch
  - Change `auto-apply/backend/deps.py` `verify_internal_api_key` to read `X-Internal-API-Key` header directly (not HTTPBearer)
  - OR change `apply-agents/reporter/status.py` to send `Authorization: Bearer {key}`

- [ ] **A.2** Create `POST /api/internal/applications/result` endpoint in auto-apply
  - Accept `ApplyResult` body
  - Auth: internal API key
  - Update `applications` table: set status to `applied` or `failed`, set `screenshot_url`, `error_message`, `metadata`, `applied_at`
  - Return 200 OK
  - Write tests

- [ ] **A.3** Clean up schema naming (ExperienceCreate → ExperienceForAgent aliases)
  - Ensure JSON wire format is compatible (it is today, but naming should be consistent)

- [ ] **A.4** Verify queue contract end-to-end
  - Write an integration test that: serializes ApplyTask in auto-apply format → deserializes in apply-agents format
  - Write a test that: serializes ApplyResult in apply-agents format → posts to auto-apply result endpoint
  - Can be done with just Pydantic (no Redis/HTTP needed)

### PHASE B: Applications API (Platform Phase 8)

User-facing endpoints for viewing application history and status.

- [ ] **B.1** Create `routers/applications.py` with:
  - `GET /api/applications` — List with filters (status, date range), pagination
  - `GET /api/applications/{id}` — Detail with screenshot URL, metadata
  - `GET /api/applications/stats` — Aggregates (total, by status, success rate, this week/month)
- [ ] **B.2** Create `services/application_service.py` for business logic
- [ ] **B.3** Write tests (auth, CRUD, filters, stats)
- [ ] **B.4** Mount router in `main.py`

### PHASE C: Document Generation (Platform Phase 9)

AI-powered cover letters and tailored resumes.

- [ ] **C.1** Create `services/document_gen.py`
  - Cover letter generation via Claude (job description + user profile → tailored letter)
  - Resume tailoring via Claude (highlight relevant skills/experience for specific job)
- [ ] **C.2** Create `routers/documents.py` with:
  - `POST /api/documents/cover-letter` — Generate cover letter for a job
  - `POST /api/documents/resume/tailor` — Tailor resume for a job
  - `GET /api/documents` — List generated documents
  - `GET /api/documents/{id}/download` — Download as PDF
- [ ] **C.3** PDF generation (reportlab or weasyprint) for downloadable documents
- [ ] **C.4** Write tests

### PHASE D: Billing & Stripe (Platform Phase 10)

Monetization: subscriptions, credits, enforcement.

- [ ] **D.1** Create `services/stripe_service.py`
  - Checkout session creation (for plan subscription)
  - Credit pack purchase
  - Customer portal session
  - Webhook event processing (subscription created/updated/deleted, payment succeeded/failed)
- [ ] **D.2** Create `routers/billing.py` with:
  - `GET /api/billing/plan` — Current plan & credit balance
  - `POST /api/billing/checkout` — Create Stripe checkout session
  - `POST /api/billing/credits/purchase` — Purchase credit pack
  - `POST /api/billing/webhooks/stripe` — Webhook handler (signature verification)
  - `GET /api/billing/history` — Transaction history
  - `POST /api/billing/portal` — Stripe customer portal session
- [ ] **D.3** Credit enforcement in auto-apply flow
  - Replace stub `check_credits()` with real credit check against subscriptions table
  - Deduct credits when tasks are queued (create credit_transaction records)
  - Block auto-apply start if credits_remaining <= 0
- [ ] **D.4** Write tests

### PHASE E: Platform Hardening (Platform Phase 11)

Production readiness for the backend.

- [ ] **E.1** Structured logging with structlog (replace print/basic logging)
- [ ] **E.2** Sentry integration for error tracking
- [ ] **E.3** Global exception handlers (422 → user-friendly JSON, 500 → generic)
- [ ] **E.4** Startup validation (check required env vars, DB connectivity, Redis connectivity)
- [ ] **E.5** Backend Dockerfile
- [ ] **E.6** Rate limiting middleware (per-user, per-IP)
- [ ] **E.7** Integration tests with real DB (marked slow, optional in CI)

### PHASE F: End-to-End Testing

Verify the full pipeline works across both repos.

- [ ] **F.1** Local E2E setup documentation
  - Both repos running locally
  - Shared Redis instance
  - Shared Supabase project
  - Matching `.env` files (INTERNAL_API_KEY, REDIS_URL, SUPABASE_URL, etc.)
- [ ] **F.2** Manual E2E smoke test
  1. Create user, upload resume, parse resume
  2. Sync jobs from Adzuna
  3. Configure auto-apply preferences
  4. Start auto-apply → verify tasks appear in Redis
  5. Start apply-agents worker → verify it picks up task
  6. Verify agent navigates to job URL, fills form (or detects CAPTCHA/login wall)
  7. Verify ApplyResult posted back to platform
  8. Verify application status updated in DB
  9. Verify user can see updated status via `GET /api/applications`
- [ ] **F.3** Contract test suite (can run without external services)
  - ApplyTask serialization roundtrip
  - ApplyResult serialization roundtrip
  - UserProfileForAgent field compatibility

### PHASE G: Frontend (Nuxt 3)

Build the user-facing SPA. Depends on all backend phases being complete.

- [ ] **G.1** Scaffold Nuxt 3 project with Nuxt UI v3 + Tailwind
- [ ] **G.2** Auth flow (login, signup, Google OAuth, session management)
- [ ] **G.3** Dashboard layout (sidebar, nav, responsive)
- [ ] **G.4** Profile page (resume upload, parsed data editor, preferences)
- [ ] **G.5** Job board page (search, filters, pagination, match scores)
- [ ] **G.6** Auto-apply settings page (config, start/stop, queue status)
- [ ] **G.7** Applications page (status feed, screenshots, stats)
- [ ] **G.8** Billing page (plan selector, credits, usage history)
- [ ] **G.9** Landing page + pricing page

---

## Environment Variables

### auto-apply (backend/.env)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/postgres

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis
REDIS_URL=redis://localhost:6379

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Jobs
ADZUNA_APP_ID=xxx
ADZUNA_API_KEY=xxx

# Billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Internal (shared with apply-agents)
INTERNAL_API_KEY=your-shared-internal-api-key

# App
ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### apply-agents (.env)

```bash
# Redis (same instance as platform)
REDIS_URL=redis://localhost:6379

# Platform API
PLATFORM_API_URL=http://localhost:8000
INTERNAL_API_KEY=your-shared-internal-api-key  # Must match platform

# Supabase (for screenshot uploads)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Browser
BROWSER_POOL_SIZE=2
HEADLESS=true
BROWSER_TIMEOUT=60000

# Worker
WORKER_CONCURRENCY=2
MAX_RETRIES=2
POLL_INTERVAL=5

# Agent
BROWSER_AGENT_MODEL=claude-sonnet-4-6
APPLICATION_AGENT_MODEL=claude-sonnet-4-6
MAX_AGENT_TURNS=50
```

**Shared values that MUST match:**
- `REDIS_URL` — same Redis instance
- `INTERNAL_API_KEY` — same secret
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — same Supabase project

---

## Pricing Model

| Plan | Monthly | Features |
|------|---------|----------|
| **Free** | $0 | Job board access, 3 resume parses, 1 cover letter/day |
| **Pro** | $19/mo | Unlimited parsing, unlimited cover letters, 25 auto-apply credits/mo |
| **Premium** | $39/mo | Everything in Pro + 100 auto-apply credits/mo + priority queue |
| **Credit Packs** | $10-$120 | 10 ($10), 50 ($40), 100 ($60), 250 ($120) |

---

## Deployment Architecture

```
┌─────────────────────────────────┐
│           Vercel                 │
│  ┌───────────────────────────┐  │
│  │     Nuxt 3 Frontend       │  │
│  └───────────────────────────┘  │
└──────────────┬──────────────────┘
               │ API calls
┌──────────────▼──────────────────┐
│      Railway / Fly.io            │
│  ┌───────────────────────────┐  │
│  │     FastAPI Backend        │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     Redis 7                │  │
│  └───────────────────────────┘  │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      Dedicated VPS               │
│  ┌───────────────────────────┐  │
│  │  Agent Workers (Docker)    │  │
│  │  Playwright + Chromium     │  │
│  │  2-4 concurrent            │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
               │
┌──────────────▼──────────────────┐
│          Supabase                │
│  ├── Postgres 15                 │
│  ├── Auth                        │
│  └── Storage                     │
└─────────────────────────────────┘
```

---

## Architectural Decisions (Locked)

1. **Supabase for Auth** — JWT verification only in backend; no custom auth system
2. **SQLAlchemy 2.0 async** — not Supabase Python client for DB queries
3. **Redis list (RPUSH/LPOP)** — not arq job API, not Celery
4. **Two repos** — `auto-apply` (platform) and `apply-agents` (workers) stay separate
5. **Two-agent design** — Browser Agent (tool-use loop) + Application Agent (single call)
6. **No hardcoded ATS logic** — agents navigate any form dynamically
7. **Credits per application** — one credit consumed per auto-apply task dispatched
8. **Internal API key** — agent workers authenticate to platform with shared key, not user JWTs
9. **pdfplumber** — pure Python PDF parsing, no system dependencies
10. **Heuristic job matching** — skill + title + location scoring (0-100), not AI-based (yet)

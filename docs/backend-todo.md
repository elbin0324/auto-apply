# Backend API — Incremental Implementation Todo

> **Repo:** `auto-apply` | **Path:** `backend/`
> **Stack:** FastAPI · SQLAlchemy 2.0 · Alembic · Supabase (Postgres + Auth + Storage) · Redis · Anthropic Claude API
>
> Work through phases in order. Each phase produces a deployable, testable increment.
> After completing each task, mark it `[x]`. After each phase, update this file and `IMPLEMENTATION_STATUS.md`.

---

## Phase 1 — Project Scaffold & Configuration
> **Goal:** Running FastAPI server with config, CORS, health check, and DB connection.

- [x] **1.1** Initialize Poetry project: `cd backend && poetry init`
- [x] **1.2** Add core dependencies:
  ```
  fastapi uvicorn[standard] pydantic pydantic-settings
  sqlalchemy[asyncio] asyncpg alembic
  supabase python-jose[cryptography] passlib[bcrypt]
  httpx python-multipart aiofiles arq
  anthropic stripe sentry-sdk
  ```
  Note: `redis` pulled in transitively by `arq` (arq requires redis<6)
- [x] **1.3** Add dev dependencies: `pytest pytest-asyncio httpx factory-boy ruff mypy`
- [x] **1.4** Create `backend/config.py` — Pydantic Settings class loading all env vars
- [x] **1.5** Create `backend/main.py` — FastAPI app factory with CORS, lifespan context manager, root router mount
- [x] **1.6** Create `backend/deps.py` — dependency injection stubs (db session, current user)
- [x] **1.7** Create `GET /api/health` endpoint returning `{"status": "ok", "version": "0.1.0"}`
- [x] **1.8** Add `backend/Makefile` with targets: `dev`, `migrate`, `test`, `lint`, `format`
- [x] **1.9** `docker-compose.yml` already exists (root); `backend/.env.example` already exists
- [x] **1.10** Verified: server starts, `GET /api/health` returns `{"status":"ok","version":"0.1.0"}` with 200

**Checkpoint:** Server starts, health endpoint returns 200, .env loaded correctly.

---

## Phase 2 — Database Models & Migrations
> **Goal:** All SQLAlchemy models defined, Alembic generating and applying migrations.

- [ ] **2.1** Create `backend/db/session.py` — async SQLAlchemy engine + session factory
- [ ] **2.2** Create `backend/db/base.py` — declarative base with common timestamp mixin
- [ ] **2.3** Initialize Alembic: `alembic init backend/db/migrations`
- [ ] **2.4** Configure `alembic.ini` and `env.py` to use async engine + import all models
- [ ] **2.5** Create `backend/models/user.py` — User model (mirrors Supabase auth.users, no password storage)
- [ ] **2.6** Create `backend/models/profile.py` — Profile, Experience, Education, Skill models
- [ ] **2.7** Create `backend/models/job.py` — Job model with GIN index config
- [ ] **2.8** Create `backend/models/application.py` — Application tracking model
- [ ] **2.9** Create `backend/models/document.py` — GeneratedDocument model
- [ ] **2.10** Create `backend/models/subscription.py` — Subscription + CreditTransaction models
- [ ] **2.11** Create `backend/models/auto_apply_config.py` — AutoApplyConfig model
- [ ] **2.12** Generate initial migration: `alembic revision --autogenerate -m "initial_schema"`
- [ ] **2.13** Apply migration to local/Supabase DB: `alembic upgrade head`
- [ ] **2.14** Verify all tables exist with correct columns and indexes

**Checkpoint:** `alembic upgrade head` succeeds, all tables present in DB.

---

## Phase 3 — Pydantic Schemas
> **Goal:** All request/response schemas defined with strict validation.

- [ ] **3.1** Create `backend/schemas/__init__.py`
- [ ] **3.2** Create `backend/schemas/user.py` — UserCreate, UserResponse, TokenResponse
- [ ] **3.3** Create `backend/schemas/profile.py` — ExperienceCreate/Response, EducationCreate/Response, SkillCreate/Response, ProfileResponse, ParsedResume
- [ ] **3.4** Create `backend/schemas/job.py` — JobSearchParams, JobResponse, JobListResponse
- [ ] **3.5** Create `backend/schemas/application.py` — ApplicationStatus, ApplicationDetail, ApplicationStats
- [ ] **3.6** Create `backend/schemas/document.py` — DocumentCreate, DocumentResponse
- [ ] **3.7** Create `backend/schemas/auto_apply.py` — AutoApplyConfig, AutoApplyStatus, ApplyTask, ApplyResult
- [ ] **3.8** Create `backend/schemas/billing.py` — PlanInfo, CreditPurchase, CheckoutSession, TransactionHistory

**Checkpoint:** All schemas import cleanly, Pydantic validation tests pass.

---

## Phase 4 — Auth (Supabase JWT Verification)
> **Goal:** Auth endpoints + JWT middleware that validates Supabase tokens.

- [ ] **4.1** Create `backend/utils/supabase.py` — Supabase client wrapper (service role for admin ops)
- [ ] **4.2** Create `backend/routers/auth.py` — router skeleton
- [ ] **4.3** Implement `POST /api/auth/signup` — create Supabase auth user, create local User row
- [ ] **4.4** Implement `POST /api/auth/login` — validate via Supabase, return JWT + refresh token
- [ ] **4.5** Implement `POST /api/auth/oauth/google` — return Supabase OAuth URL for Google
- [ ] **4.6** Implement `GET /api/auth/oauth/callback` — handle OAuth callback, exchange code for session
- [ ] **4.7** Implement `POST /api/auth/logout` — invalidate Supabase session
- [ ] **4.8** Implement `GET /api/auth/me` — return current user from JWT
- [ ] **4.9** Update `backend/deps.py` — `get_current_user` dependency: extract + verify Supabase JWT, return user
- [ ] **4.10** Add auth middleware to reject unauthorized requests on protected routes
- [ ] **4.11** Write tests: signup, login, protected route without token (401), with token (200)

**Checkpoint:** Can sign up, log in, hit protected endpoint with JWT, get 401 without token.

---

## Phase 5 — Profile API
> **Goal:** Full CRUD for user profile including resume upload trigger.

- [ ] **5.1** Create `backend/routers/profile.py`
- [ ] **5.2** Implement `GET /api/profile` — return full profile with experiences, education, skills
- [ ] **5.3** Implement `PUT /api/profile` — update top-level profile fields (name, phone, location, etc.)
- [ ] **5.4** Implement `PUT /api/profile/experiences` — bulk replace experiences list
- [ ] **5.5** Implement `PUT /api/profile/education` — bulk replace education list
- [ ] **5.6** Implement `PUT /api/profile/skills` — bulk replace skills list
- [ ] **5.7** Create `backend/utils/storage.py` — Supabase Storage helper (upload, get signed URL, delete)
- [ ] **5.8** Implement `POST /api/profile/resume/upload` — accept PDF, upload to Supabase Storage bucket `resumes/{user_id}/resume.pdf`, store URL in profile
- [ ] **5.9** Create `backend/utils/pdf_parser.py` — extract raw text from PDF using `pdfplumber` or `pymupdf`
- [ ] **5.10** Create `backend/services/resume_parser.py` — send raw text to Claude API, parse structured `ParsedResume` response
- [ ] **5.11** Implement `POST /api/profile/resume/parse` — trigger async parse, store result in `profiles.parsed_resume`
- [ ] **5.12** Implement `GET /api/profile/resume/parsed` — return stored parsed resume JSON
- [ ] **5.13** Create `backend/services/ai_client.py` — Anthropic client wrapper with retry logic
- [ ] **5.14** Write tests: profile CRUD, resume upload mock, parse mock

**Checkpoint:** Can upload resume PDF, trigger parse, retrieve structured parsed data.

---

## Phase 6 — Jobs API & Adzuna Sync
> **Goal:** Job board with search, filters, and scheduled Adzuna sync.

- [ ] **6.1** Create `backend/routers/jobs.py`
- [ ] **6.2** Implement `GET /api/jobs` — paginated job search with full-text search (Postgres FTS), location, location_type, salary_min, category filters
- [ ] **6.3** Implement `GET /api/jobs/:id` — single job detail
- [ ] **6.4** Create `backend/services/job_sync.py` — Adzuna API client, fetch + upsert jobs
- [ ] **6.5** Implement `POST /api/jobs/sync` — admin-only endpoint to trigger manual sync
- [ ] **6.6** Create `backend/services/job_matcher.py` — compute match score between user profile and job using Claude (skills overlap, title match, location match)
- [ ] **6.7** Implement `GET /api/jobs/:id/match` — return match score for authenticated user
- [ ] **6.8** Add APScheduler (or `arq` cron) job to sync Adzuna every 6 hours in lifespan
- [ ] **6.9** Write tests: job search with filters, pagination, sync mock

**Checkpoint:** Job board returns results, full-text search works, Adzuna sync upserts correctly.

---

## Phase 7 — Auto-Apply Config API
> **Goal:** CRUD for auto-apply preferences and start/stop control.

- [ ] **7.1** Create `backend/routers/auto_apply.py`
- [ ] **7.2** Implement `GET /api/auto-apply/config` — return user's auto-apply config (create default if none)
- [ ] **7.3** Implement `PUT /api/auto-apply/config` — update preferences (titles, locations, salary, limits, etc.)
- [ ] **7.4** Implement `POST /api/auto-apply/start` — set `is_active = true`, trigger initial job matching
- [ ] **7.5** Implement `POST /api/auto-apply/stop` — set `is_active = false`
- [ ] **7.6** Create `backend/services/queue_service.py` — Redis/arq queue client, push `ApplyTask` messages
- [ ] **7.7** Implement auto-apply job matcher: query jobs matching user config, filter already-applied, check credit balance, push tasks to queue
- [ ] **7.8** Implement `GET /api/auto-apply/queue` — return current queue depth + pending applications
- [ ] **7.9** Implement `POST /api/auto-apply/review/:id` — approve or reject pending_review application
- [ ] **7.10** Write tests: config CRUD, start/stop, queue push mock

**Checkpoint:** Config saves correctly, start pushes tasks to Redis queue, stop halts.

---

## Phase 8 — Applications API
> **Goal:** Application tracking, status, and stats endpoints.

- [ ] **8.1** Create `backend/routers/applications.py`
- [ ] **8.2** Implement `GET /api/applications` — paginated list with status filter, date range
- [ ] **8.3** Implement `GET /api/applications/:id` — detail including screenshot URL (signed), cover letter used
- [ ] **8.4** Implement `GET /api/applications/stats` — aggregate: total applied, pending, failed, this week
- [ ] **8.5** Create internal endpoint `POST /api/internal/applications/result` — for agent workers to post `ApplyResult` back (API-key auth, not JWT)
- [ ] **8.6** Handler for agent result: update application status, store screenshot_url, deduct credit
- [ ] **8.7** Write tests: list pagination, stats aggregation, agent result posting

**Checkpoint:** Applications list and stats work; agent can post results back.

---

## Phase 9 — Document Generation API
> **Goal:** On-demand cover letter and tailored resume generation.

- [ ] **9.1** Create `backend/routers/documents.py`
- [ ] **9.2** Create `backend/services/document_gen.py` — cover letter generation prompt + Claude call
- [ ] **9.3** Implement `POST /api/documents/cover-letter` — generate cover letter for job_id, store in generated_documents
- [ ] **9.4** Create resume tailoring service — adjust parsed resume bullets to highlight relevant skills for job
- [ ] **9.5** Implement `POST /api/documents/resume/tailor` — tailor resume for job_id, store result
- [ ] **9.6** Implement `GET /api/documents` — list user's generated documents
- [ ] **9.7** Implement `GET /api/documents/:id/download` — return signed URL for PDF (or generate PDF from text)
- [ ] **9.8** Add PDF generation for documents using `reportlab` or `weasyprint`
- [ ] **9.9** Write tests: generation mocks, list, download URL

**Checkpoint:** Cover letter and tailored resume generate correctly, downloadable as PDF.

---

## Phase 10 — Billing & Stripe Integration
> **Goal:** Subscription plans, credit system, Stripe checkout + webhooks.

- [ ] **10.1** Create `backend/routers/billing.py`
- [ ] **10.2** Create `backend/services/stripe_service.py` — Stripe client wrapper
- [ ] **10.3** Implement `GET /api/billing/plan` — return current plan + credit balance
- [ ] **10.4** Implement `POST /api/billing/checkout` — create Stripe Checkout Session for Pro/Premium plan
- [ ] **10.5** Implement `POST /api/billing/credits/purchase` — create Checkout Session for credit pack
- [ ] **10.6** Implement `POST /api/billing/webhooks/stripe` — handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - On subscription: update plan + grant monthly credits
  - On credit purchase: add credits + log transaction
- [ ] **10.7** Implement `GET /api/billing/history` — paginated credit transaction history
- [ ] **10.8** Implement `POST /api/billing/portal` — create Stripe Customer Portal session
- [ ] **10.9** Add credit enforcement middleware — check credits before pushing auto-apply tasks
- [ ] **10.10** Add rate limiting middleware (slowapi) per user tier
- [ ] **10.11** Write tests: webhook handler with mock Stripe events, credit deduction

**Checkpoint:** Checkout creates Stripe session, webhook grants credits, plan info returns correctly.

---

## Phase 11 — Hardening & Production Readiness
> **Goal:** Error handling, logging, Sentry, environment validation, final cleanup.

- [ ] **11.1** Add structured logging with `structlog` or `logging` — request ID, user ID, duration
- [ ] **11.2** Integrate Sentry SDK — capture exceptions, performance traces
- [ ] **11.3** Add global exception handlers — return consistent JSON error format
- [ ] **11.4** Add request validation error handler (422 → friendly message)
- [ ] **11.5** Add startup validation — fail fast if required env vars missing
- [ ] **11.6** Write `backend/tests/conftest.py` with async test client fixture, test DB setup
- [ ] **11.7** Write integration tests covering happy path for each router
- [ ] **11.8** Add `Dockerfile` for backend
- [ ] **11.9** Configure Railway / Fly.io deployment (add `railway.toml` or `fly.toml`)
- [ ] **11.10** Document all endpoints in OpenAPI (FastAPI auto-generates — verify at `/docs`)

**Checkpoint:** All tests pass, server deploys to staging, `/docs` shows all endpoints.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked — see notes

---

## Notes / Decisions Log

_Add decisions, blockers, and context here as you work._

| Date | Note |
|------|------|
| 2026-02-27 | Phase 1 complete. Poetry installed via pip (not system-installed). `arq` requires redis<6 so redis not added explicitly — pulled transitively. Root Makefile and docker-compose.yml were pre-existing. `ruff` and `mypy` added as dev tools. |

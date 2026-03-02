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

- [x] **2.1** Create `backend/db/session.py` — async SQLAlchemy engine + session factory
- [x] **2.2** Create `backend/db/base.py` — declarative base with common timestamp mixin
- [x] **2.3** Initialize Alembic: `alembic init backend/db/migrations`
- [x] **2.4** Configure `alembic.ini` and `env.py` to use async engine + import all models
- [x] **2.5** Create `backend/models/user.py` — User model (mirrors Supabase auth.users, no password storage)
- [x] **2.6** Create `backend/models/profile.py` — Profile, Experience, Education, Skill models
- [x] **2.7** Create `backend/models/job.py` — Job model with GIN index config
- [x] **2.8** Create `backend/models/application.py` — Application tracking model
- [x] **2.9** Create `backend/models/document.py` — GeneratedDocument model
- [x] **2.10** Create `backend/models/subscription.py` — Subscription + CreditTransaction models
- [x] **2.11** Create `backend/models/auto_apply_config.py` — AutoApplyConfig model
- [x] **2.12** Migration written manually at `db/migrations/versions/91febbf95276_initial_schema.py`
- [x] **2.13** Applied migration to Supabase DB: `alembic upgrade head` (fix: `statement_cache_size=0` for pgbouncer)
- [x] **2.14** Verified all 11 tables in DB: users, profiles, experiences, educations, skills, jobs, auto_apply_configs, applications, generated_documents, subscriptions, credit_transactions

**Checkpoint:** `alembic upgrade head` succeeds, all tables present in DB.

---

## Phase 3 — Pydantic Schemas
> **Goal:** All request/response schemas defined with strict validation.

- [x] **3.1** Create `backend/schemas/__init__.py`
- [x] **3.2** Create `backend/schemas/user.py` — UserCreate, UserResponse, TokenResponse
- [x] **3.3** Create `backend/schemas/profile.py` — ExperienceCreate/Response, EducationCreate/Response, SkillCreate/Response, ProfileResponse, ProfileUpdate, ParsedResume
- [x] **3.4** Create `backend/schemas/job.py` — JobSearchParams, JobResponse, JobListResponse
- [x] **3.5** Create `backend/schemas/application.py` — ApplicationStatus (StrEnum), ApplicationDetail, ApplicationListResponse, ApplicationStats
- [x] **3.6** Create `backend/schemas/document.py` — DocumentCreate, DocumentResponse, DocumentListResponse
- [x] **3.7** Create `backend/schemas/auto_apply.py` — AutoApplyConfigUpdate/Response, AutoApplyStatus, QueueStatus, ApplyTask, ApplyResult
- [x] **3.8** Create `backend/schemas/billing.py` — PlanInfo, CreditPurchase, CheckoutSession, TransactionItem, TransactionHistory

**Checkpoint:** All schemas import cleanly, Pydantic validation tests pass.

---

## Phase 4 — Auth (Supabase JWT Verification)
> **Goal:** Auth endpoints + JWT middleware that validates Supabase tokens.

- [x] **4.1** Create `backend/utils/supabase.py` — Supabase client wrapper (service role for admin ops)
- [x] **4.2** Create `backend/routers/auth.py` — router skeleton
- [x] **4.3** Implement `POST /api/auth/signup` — create Supabase auth user, create local User row
- [x] **4.4** Implement `POST /api/auth/login` — validate via Supabase, return JWT + refresh token
- [x] **4.5** Implement `POST /api/auth/oauth/google` — return Supabase OAuth URL for Google
- [x] **4.6** Implement `GET /api/auth/oauth/callback` — handle OAuth callback, exchange code for session
- [x] **4.7** Implement `POST /api/auth/logout` — invalidate Supabase session (best-effort)
- [x] **4.8** Implement `GET /api/auth/me` — return current user from JWT
- [x] **4.9** Updated `backend/deps.py` — `get_current_user` verifies JWT via Supabase, returns User row
- [x] **4.10** Auth enforced via FastAPI HTTPBearer on all protected routes (no extra middleware needed)
- [x] **4.11** Tests: health ✓, protected without token → 401 ✓, protected with bad token → 401 ✓

**Checkpoint:** Can sign up, log in, hit protected endpoint with JWT, get 401 without token.

---

## Phase 5 — Profile API
> **Goal:** Full CRUD for user profile including resume upload trigger.

- [x] **5.1** Create `backend/routers/profile.py`
- [x] **5.2** Implement `GET /api/profile` — return full profile with experiences, education, skills
- [x] **5.3** Implement `PUT /api/profile` — update top-level profile fields (name, phone, location, etc.)
- [x] **5.4** Implement `PUT /api/profile/experiences` — bulk replace experiences list
- [x] **5.5** Implement `PUT /api/profile/education` — bulk replace education list
- [x] **5.6** Implement `PUT /api/profile/skills` — bulk replace skills list
- [x] **5.7** Create `backend/utils/storage.py` — Supabase Storage helper (upload, get signed URL, delete)
- [x] **5.8** Implement `POST /api/profile/resume/upload` — accept PDF, upload to Supabase Storage bucket `resumes/{user_id}/resume.pdf`, store URL in profile
- [x] **5.9** Create `backend/utils/pdf_parser.py` — extract raw text from PDF using `pdfplumber`
- [x] **5.10** Create `backend/services/resume_parser.py` — send raw text to Claude API, parse structured `ParsedResume` response
- [x] **5.11** Implement `POST /api/profile/resume/parse` — trigger async parse, store result in `profiles.parsed_resume`
- [x] **5.12** Implement `GET /api/profile/resume/parsed` — return stored parsed resume JSON
- [x] **5.13** Create `backend/services/ai_client.py` — Anthropic client wrapper
- [x] **5.14** Write tests: profile CRUD, resume upload mock, parse mock (17 tests, all passing)

**Checkpoint:** Can upload resume PDF, trigger parse, retrieve structured parsed data.

---

## Phase 6 — Jobs API & Adzuna Sync
> **Goal:** Job board with search, filters, and scheduled Adzuna sync.

- [x] **6.1** Create `backend/routers/jobs.py`
- [x] **6.2** Implement `GET /api/jobs` — paginated job search with full-text search (Postgres FTS), location, location_type, salary_min, category filters
- [x] **6.3** Implement `GET /api/jobs/:id` — single job detail
- [x] **6.4** Create `backend/services/job_sync.py` — Adzuna API client, fetch + upsert jobs (Canada IT, 5 pages x 50)
- [x] **6.5** Implement `POST /api/jobs/sync` — admin-only endpoint (internal API key auth) to trigger manual sync
- [x] **6.6** Create `backend/services/job_matcher.py` — heuristic match scorer (skill overlap 50pts + title similarity 30pts + location match 20pts). AI scoring deferred to Phase 9.
- [x] **6.7** Implement `GET /api/jobs/:id/match` — return pre-computed match score for authenticated user
- [x] **6.8** Scheduler deferred to Phase 11 — manual sync via POST /api/jobs/sync only
- [x] **6.9** Write tests: auth, search, detail, match, sync, scorer unit tests (26 tests, all passing)

**Checkpoint:** Job board returns results, full-text search works, Adzuna sync upserts correctly.

---

## Phase 7 — Auto-Apply Config API
> **Goal:** CRUD for auto-apply preferences and start/stop control.

- [x] **7.1** Create `backend/routers/auto_apply.py`
- [x] **7.2** Implement `GET /api/auto-apply/config` — return user's auto-apply config (create default if none)
- [x] **7.3** Implement `PUT /api/auto-apply/config` — update preferences (titles, locations, salary, limits, etc.)
- [x] **7.4** Implement `POST /api/auto-apply/start` — set `is_active = true`, trigger initial job matching
- [x] **7.5** Implement `POST /api/auto-apply/stop` — set `is_active = false`
- [x] **7.6** Create `backend/services/queue_service.py` — Redis/arq queue client, push `ApplyTask` messages
- [x] **7.7** Implement auto-apply job matcher: query jobs matching user config, filter already-applied, check credit balance, push tasks to queue
- [x] **7.8** Implement `GET /api/auto-apply/queue` — return current queue depth + pending applications
- [x] **7.9** Implement `POST /api/auto-apply/review/:id` — approve or reject pending_review application
- [x] **7.10** Write tests: config CRUD, start/stop, queue push mock (30 tests, all passing)

**Checkpoint:** Config saves correctly, start pushes tasks to Redis queue, stop halts.

---

## Phase 8 — Applications API
> **Goal:** Application tracking, status, and stats endpoints.

- [x] **8.1** Create `backend/routers/applications.py`
- [x] **8.2** Implement `GET /api/applications` — paginated list with status filter, date range
- [x] **8.3** Implement `GET /api/applications/:id` — detail including screenshot URL (signed), cover letter used
- [x] **8.4** Implement `GET /api/applications/stats` — aggregate: total applied, pending, failed, this week
- [x] **8.5** Create internal endpoint `POST /api/internal/applications/result` — for agent workers to post `ApplyResult` back (API-key auth, not JWT)
- [x] **8.6** Handler for agent result: update application status, store screenshot_url, deduct credit
- [x] **8.7** Write tests: list pagination, stats aggregation, agent result posting

**Checkpoint:** Applications list and stats work; agent can post results back.

---

## Phase 9A — Background Scheduling & Continuous Auto-Apply
> **Goal:** Job sync runs on a schedule. Auto-apply becomes truly continuous by periodically re-matching jobs for active users.
> **Architecture:** arq worker process (separate from FastAPI) with cron jobs, using same Redis instance but distinct queue name (`arq:scheduler`).
> **Branch:** `phase/9A-scheduling`

- [x] **9A.1** Create `backend/worker.py` — arq `WorkerSettings` with `on_startup`/`on_shutdown` hooks that initialize `AsyncSessionLocal` from `db/session.py`
- [x] **9A.2** Implement `task_sync_jobs` background task — calls `run_sync()` from `services/job_sync.py` + `compute_scores_for_sync()` from `services/job_matcher.py` (same logic as `POST /api/jobs/sync` but non-blocking)
- [x] **9A.3** Implement `task_rematch_active_users` background task — queries all `AutoApplyConfig` where `is_active=True`, calls `run_matching_for_user()` for each (existing function handles dedup, daily limits, queue push)
- [x] **9A.4** Register cron schedules in `WorkerSettings`: sync every 6 hours (`hour={0,6,12,18}`), rematch every 30 minutes (`minute={0,30}`)
- [x] **9A.5** Make job sync configurable — add `adzuna_sync_country`, `adzuna_sync_categories`, `adzuna_sync_pages` to `config.py` Settings; replace hardcoded constants in `services/job_sync.py`
- [x] **9A.6** Add `worker` and `worker-dev` targets to Makefile: `poetry run arq worker.WorkerSettings`
- [x] **9A.7** Add `POST /api/internal/scheduler/rematch` endpoint (internal API key auth) for manually triggering a rematch cycle
- [x] **9A.8** Add `GET /api/health/scheduler` endpoint — reads arq worker heartbeat from Redis to report scheduler status
- [x] **9A.9** Write tests: `task_sync_jobs` and `task_rematch_active_users` with mocked db + services, verify correct calls and error handling (11 tests, all passing)
- [x] **9A.10** Update `IMPLEMENTATION_STATUS.md` and this file

**Checkpoint:** `make worker` starts arq worker, sync runs every 6h, re-matching runs every 30min for active users, new jobs are automatically matched and queued.

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
| 2026-02-27 | Phase 2 models + migration complete. `greenlet` added as explicit dep (required by SQLAlchemy asyncio). Migration written manually (not autogenerated) because DATABASE_URL not yet pointing to Supabase. Task 2.13 blocked on user updating DATABASE_URL. |
| 2026-02-27 | Phase 5 complete. Profile CRUD, bulk replace for experiences/education/skills, resume upload to Supabase Storage, PDF text extraction via pdfplumber, resume parsing via Claude API (claude-sonnet-4-6), and parsed resume retrieval. 17 new tests (20 total). Supabase storage client is sync — follows same pattern as auth (acceptable for bounded file sizes). |
| 2026-02-27 | Phase 6 complete. Jobs API with Adzuna sync (Canada IT, 5 pages x 50), Postgres FTS search, heuristic match scoring (skill 50pts + title 30pts + location 20pts). New `job_match_scores` table + migration. Scores pre-computed after sync for active users. Scheduler deferred to Phase 11. AI scoring deferred to Phase 9. 26 new tests (46 total). PostgreSQL-specific `insert` with `on_conflict_do_update` for upserts. |
| 2026-02-27 | Phase 8 complete. Applications API with list/detail/stats + internal agent result endpoint. Also fixed 3 integration gaps: (1) `verify_internal_api_key` changed from `HTTPBearer()` to `Header()` for `X-Internal-API-Key` (matches apply-agents), (2) added `ExperienceForAgent`/`EducationForAgent`/`SkillForAgent` aliases in schemas, (3) `POST /api/internal/applications/result` endpoint for agent workers. 23 new tests (108 total). Credit deduction stubbed — real enforcement deferred to Phase 10. |
| 2026-03-01 | Phase 9A complete. arq background worker (`worker.py`) with two cron tasks: `task_sync_jobs` (every 6h) and `task_rematch_active_users` (every 30min). Job sync config now configurable via env vars (country, categories, pages). Scheduler health endpoint at `GET /api/health/scheduler`. Manual rematch trigger at `POST /api/internal/scheduler/rematch`. 11 new tests (119 total). |

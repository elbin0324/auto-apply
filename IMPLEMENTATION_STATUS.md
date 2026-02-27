# Implementation Status

> Last Updated: 2026-02-27
> Current Phase: Phase 7 — Auto-Apply Config API
> Backend Progress: 6 / 11 phases complete

---

## Quick Status

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| 1 | Project Scaffold & Configuration | Complete | 10/10 |
| 2 | Database Models & Migrations | Complete | 14/14 |
| 3 | Pydantic Schemas | Complete | 8/8 |
| 4 | Auth (Supabase JWT) | Complete | 11/11 |
| 5 | Profile API | Complete | 14/14 |
| 6 | Jobs API & Adzuna Sync | Complete | 9/9 |
| 7 | Auto-Apply Config API | Not Started | 0/10 |
| 8 | Applications API | Not Started | 0/7 |
| 9 | Document Generation API | Not Started | 0/9 |
| 10 | Billing & Stripe | Not Started | 0/11 |
| 11 | Hardening & Production | Not Started | 0/10 |

---

## Completed Phases

### Phase 6 — Jobs API & Adzuna Sync
Completed: 2026-02-27
- `routers/jobs.py` — 4 endpoints: GET /api/jobs (FTS search + filters), GET /api/jobs/:id, GET /api/jobs/:id/match, POST /api/jobs/sync
- `services/job_sync.py` — Adzuna API client (Canada IT, 5 pages x 50), upsert via PG ON CONFLICT, stale job deactivation (>30 days)
- `services/job_matcher.py` — heuristic scorer (skill overlap 50pts + title Jaccard 30pts + location match 20pts), bulk pre-compute after sync
- `models/job_match_score.py` — new table for pre-computed (user_id, job_id, score, factors JSONB)
- Migration `b3a1c7e42d90` — `job_match_scores` table with unique constraint + indexes
- Sync endpoint uses internal API key auth (not JWT), scores computed for active users after sync
- Scheduler deferred to Phase 11; AI scoring upgrade deferred to Phase 9
- 26 new tests (46 total): auth protection, search, detail, match, sync mock, 14 scorer unit tests

### Phase 5 — Profile API
Completed: 2026-02-27
- `routers/profile.py` — 8 endpoints: GET/PUT profile, PUT experiences/education/skills, POST resume/upload, POST resume/parse, GET resume/parsed
- `services/ai_client.py` — Anthropic AsyncAnthropic wrapper with `chat_completion` helper
- `services/resume_parser.py` — sends PDF text to Claude, returns structured `ParsedResume`
- `utils/storage.py` — Supabase Storage helpers: `upload_resume`, `get_resume_signed_url`
- `utils/pdf_parser.py` — `extract_text_from_pdf` using pdfplumber
- Profile auto-creates on first access (one-to-one with User)
- Bulk replace pattern: delete existing + insert new for experiences/education/skills
- Resume flow: upload PDF → store in Supabase Storage → parse via Claude → store JSON in profile
- 17 new tests (20 total): auth protection, CRUD, upload validation, parse flow mock

### Phase 4 — Auth (Supabase JWT)
Completed: 2026-02-27
- `utils/supabase.py` — cached Supabase service-role client
- `routers/auth.py` — signup, login, OAuth Google, OAuth callback, logout, /me
- `deps.py` — `get_current_user` verifies Supabase JWT → returns local User row
- `CurrentUser` / `DbSession` Annotated types for clean route signatures
- Auth via `HTTPBearer` (FastAPI standard, no extra middleware)
- 3 tests passing: health, 401 without token, 401 with bad token
- Note: `AuthApiError` imported from `supabase` package (not `gotrue` directly)

### Phase 3 — Pydantic Schemas
Completed: 2026-02-27
- 33 schema classes across 7 files (user, profile, job, application, document, auto_apply, billing)
- All use Pydantic v2 (`ConfigDict(from_attributes=True)`)
- `ApplicationStatus` uses Python 3.11+ `StrEnum`
- `ApplyTask` / `ApplyResult` are queue message contracts (shared with agent workers)
- All schemas import-tested cleanly

### Phase 2 — Database Models & Migrations
Completed: 2026-02-27
- SQLAlchemy 2.0 async engine + session factory
- DeclarativeBase + TimestampMixin
- 11 models: User, Profile, Experience, Education, Skill, Job, Application, GeneratedDocument, Subscription, CreditTransaction, AutoApplyConfig
- GIN index on jobs for full-text search
- Alembic configured with async env.py (+ `statement_cache_size=0` for Supabase pgbouncer)
- Migration applied to Supabase — all 11 tables verified

### Phase 1 — Project Scaffold & Configuration
Completed: 2026-02-27
- Poetry project initialized with all production + dev dependencies
- `backend/config.py` — Pydantic Settings loading all env vars from `.env`
- `backend/main.py` — FastAPI app factory with CORS middleware and lifespan
- `backend/deps.py` — Auth dependency stubs (implemented in Phase 4)
- `backend/routers/health.py` — `GET /api/health` returns `{"status":"ok","version":"0.1.0"}`
- `backend/Makefile` — `dev`, `test`, `migrate`, `lint`, `format` targets
- Server verified: health endpoint returns 200

---

## In-Progress Phases

_None — Phase 6 complete. Ready for Phase 7._

---

## Files Created

### Project Setup
- `aiapply-clone-implementation-plan.md` — Full architecture reference (exists)
- `CLAUDE.md` — Agent instructions (created 2026-02-27)
- `IMPLEMENTATION_STATUS.md` — This file (created 2026-02-27)
- `docs/backend-todo.md` — Backend implementation checklist (created 2026-02-27)
- `docs/user-setup-tasks.md` — Human setup tasks (created 2026-02-27)
- `.claude/skills/auto-apply-dev.md` — Custom dev skill (created 2026-02-27)
- `memory/MEMORY.md` — Agent memory (created 2026-02-27)

### Backend — Phase 1
- `backend/pyproject.toml` — Poetry project config + tool settings (pytest, ruff, mypy)
- `backend/poetry.lock` — Locked dependencies
- `backend/config.py` — Pydantic Settings (all env vars)
- `backend/main.py` — FastAPI app factory (CORS, lifespan, router mount)
- `backend/deps.py` — Dependency injection stubs (auth stubs for Phase 4)
- `backend/routers/__init__.py` — Router package
- `backend/routers/health.py` — GET /api/health
- `backend/Makefile` — Backend-specific make targets
- `backend/tests/__init__.py` — Test package stub

### Backend — Phase 6
- `backend/models/job_match_score.py` — JobMatchScore model
- `backend/db/migrations/versions/b3a1c7e42d90_add_job_match_scores.py` — Migration
- `backend/services/job_sync.py` — Adzuna sync service
- `backend/services/job_matcher.py` — Heuristic job matching
- `backend/routers/jobs.py` — Jobs API router
- `backend/tests/test_jobs.py` — 26 jobs tests

### Backend — Phase 5
- `backend/routers/profile.py` — Profile CRUD + resume endpoints
- `backend/services/__init__.py` — Services package
- `backend/services/ai_client.py` — Anthropic client wrapper
- `backend/services/resume_parser.py` — Resume parsing via Claude API
- `backend/utils/storage.py` — Supabase Storage helpers
- `backend/utils/pdf_parser.py` — PDF text extraction (pdfplumber)
- `backend/tests/test_profile.py` — 17 profile tests

---

## Architectural Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-27 | Use `arq` (not Celery or BullMQ) for task queue | Lightweight async Python queue, no Node.js dependency, native async support |
| 2026-02-27 | SQLAlchemy 2.0 directly (not Supabase Python client) for DB queries | Better async support, full ORM power, Alembic migrations |
| 2026-02-27 | Internal API key (not JWT) for agent→platform communication | Agents are server-side, don't have user context; simpler auth for internal calls |
| 2026-02-27 | Use `pdfplumber` (not `pymupdf`) for PDF text extraction | Pure Python, simpler API, sufficient for resume text extraction |
| 2026-02-27 | Sync Supabase storage calls from async handlers | Supabase Python client is sync; bounded file sizes (10MB max) make brief blocking acceptable |
| 2026-02-27 | Heuristic scorer for MVP, AI scoring later (Phase 9) | Free, fast, no API costs; good enough for initial matching; Claude scoring adds cost per (user, job) pair |
| 2026-02-27 | Pre-compute match scores after sync (not on-demand) | Better UX for job list; bounded compute (250 jobs x N active users); stored in dedicated table |
| 2026-02-27 | PostgreSQL `insert` with `on_conflict_do_update` for upserts | Must use `sqlalchemy.dialects.postgresql.insert`, not generic `sqlalchemy.insert` |

---

## Known Issues / Blockers

_None yet._

---

## External Accounts Status

See `docs/user-setup-tasks.md` for the full setup checklist.

| Service | Account Created | API Keys Collected | MCP Server Added |
|---------|----------------|-------------------|-----------------|
| Supabase | [x] | [x] | [ ] |
| Anthropic | [x] | [x] | N/A |
| Adzuna | [x] | [x] | N/A |
| Stripe | [x] | [x] (keys only — Price IDs pending Phase 10) | [ ] |
| Google OAuth | [x] | [x] | N/A |
| Sentry | [ ] | [ ] | N/A |
| Railway/Fly.io | [ ] | [ ] | N/A |
| Vercel | [ ] | [ ] | [ ] |

---

## Notes

| Date | Note |
|------|------|
| 2026-02-27 | Project initialized. All planning documents created. Ready to begin Phase 1. |
| 2026-02-27 | External accounts for Phases 1–9 complete: Supabase (project + storage buckets + Google OAuth), Anthropic, Adzuna, Stripe (account + keys). Stripe Price IDs not needed until Phase 10. Phase 1 implementation can now begin. |

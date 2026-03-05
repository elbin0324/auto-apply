# Changelog

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- HTTP health check server on port 8080 in BaseWorker for Railway health monitoring

### Fixed
- Add `PYTHONUNBUFFERED=1` to Dockerfile so worker logs (fetch, score) flush immediately to Railway

### Changed
- Replace standalone cron script (`backend/cron/`) with internal API endpoint `POST /api/internal/scheduler/fetch`
- Railway cron now curls the API instead of running a Python process
- Refactored cron fetch tests to use HTTP endpoint via TestClient

### Removed
- `backend/cron/` package (enqueue_fetch.py)

## [2026-03-04] migrate-active-jobs-db-api

### Added
- Active Jobs DB API integration as sole job source
- New `backend/workers/` directory structure with `queues/`, `services/` subdirs
- `backend/infra/` package for infrastructure (logging, Redis pool, DLQ, heartbeat)
- `backend/workers/fetch.py` — dedicated job fetch worker
- `backend/schemas/base_task.py` — base task schema
- `backend/workers/services/job_filter.py` — job filtering service
- Soft-delete migration for JSearch jobs

### Changed
- Migrated from JSearch API to Active Jobs DB API for job fetching
- Reorganized backend: services split into `workers/`, `infra/`, and `services/`
- Renamed `backend/schemas/crawl.py` to `backend/schemas/queue_tasks.py`
- Moved worker base class to `backend/workers/base.py`
- Moved scoring, enrichment, and fetch services under `backend/workers/services/`
- Moved queue implementations under `backend/workers/queues/`

### Removed
- JSearch API integration
- `backend/services/ai_client.py` (moved to infra)
- `backend/services/job_matcher.py`
- `backend/services/job_sync.py`

## [2026-03-03] llm-job-scoring

### Added
- Batched LLM-based job scoring using Claude API
- Rescore endpoints for existing jobs in admin panel
- Frontend admin panel changes for scoring management

### Changed
- Replaced heuristic scoring with LLM-based scoring

### Removed
- Heuristic scoring logic

## [2026-03-03] ui-polish-animations

### Added
- Page enter animations and transitions
- Loading skeleton components
- Checkbox components (shadcn/ui)
- Micro-interactions across dashboard, jobs, and applications pages

## [2026-03-03] frontend-ui-improvements

### Added
- Reusable UI components (company-logo, job-status-badge, match-score-badge, section-card)
- Auto-apply config form component
- Job card, job filters, job list, job search bar components
- Profile editor components (education, experience, preferences, skills)
- Page-level hooks (use-auto-apply-status)

### Changed
- Refactored frontend with shared component library
- Polish pass on all pages

## [2026-03-02] remove-ats-scraping-replace-with-jsearch

### Added
- JSearch API integration via RapidAPI
- New job page with JSearch-powered search

### Removed
- ATS career page scraping (Workday, Greenhouse, Lever, Ashby, SmartRecruiters)
- Adzuna API integration
- All ATS crawler code

## [2026-03-02] railway-worker-observability

### Added
- Railway config-as-code files (`api.railway.toml`)
- Worker heartbeat and health monitoring
- Structured logging for worker processes
- DLQ (dead letter queue) for failed tasks

### Fixed
- Enrichment pipeline errors
- Unused import warnings

## [2026-03-02] Initial platform build

### Added
- FastAPI backend with app factory pattern
- SQLAlchemy 2.0 async ORM with 11 tables
- Alembic migrations
- Supabase Auth (JWT) integration
- Profile API with resume upload and AI-powered parsing
- Jobs API with search, filtering, and matching
- Auto-apply config, start/stop, and queue dispatch
- Applications API with agent result callback
- arq background worker (job discovery, matching, enrichment)
- Admin panel with worker management
- React 19 + Vite frontend with all pages
- TanStack Router + Query for routing and data fetching
- shadcn/ui component library with dark theme
- Landing page with glassmorphism design
- Dashboard, profile, jobs, auto-apply, and applications pages
- Docker Compose for local Redis
- Full test suite

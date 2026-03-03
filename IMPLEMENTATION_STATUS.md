# Implementation Status

> Last Updated: 2026-03-02 
> Current Phase: Backend Phase 9 (Document Generation) — not started · Frontend COMPLETE
> Backend Progress: 10 / 13 phases complete (146 tests passing, ~4,800 lines)
> Frontend Progress: 9 / 9 phases complete
> Apply-Agents (Repo 2): 6 / 6 phases complete (75 tests passing, ~4,300 lines)

---

## Quick Status

### Backend Phases

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| 1 | Project Scaffold & Configuration | Complete | 10/10 |
| 2 | Database Models & Migrations | Complete | 14/14 |
| 3 | Pydantic Schemas | Complete | 8/8 |
| 4 | Auth (Supabase JWT) | Complete | 11/11 |
| 5 | Profile API | Complete | 14/14 |
| 6 | Jobs API & Adzuna Sync | Complete | 9/9 |
| **6B** | **ATS Career Page Crawling (Job Discovery)** | **Complete** | **11/11** |
| 7 | Auto-Apply Config API | Complete | 10/10 |
| 8 | Applications API | Complete | 7/7 |
| **9A** | **Background Scheduling & Continuous Auto-Apply** | **Complete** | **10/10** |
| 9 | Document Generation API | Not Started | 0/9 |
| 10 | Billing & Stripe | Not Started | 0/11 |
| 11 | Hardening & Production | Not Started | 0/10 |

### Frontend Phases

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| F1 | Project Scaffold | Complete | 18/18 |
| F2 | Auth Flow | Complete | 10/10 |
| F3 | Layout & Navigation | Complete | 9/9 |
| F4 | Dashboard / Home | Complete | 10/10 |
| F5 | Profile Page | Complete | 11/11 |
| F6 | Job Board | Complete | 10/10 |
| F7 | Auto-Apply Settings | Complete | 8/8 |
| F8 | Applications Page | Complete | 8/8 |
| F9 | Landing Page | Complete | 16/16 |

---

## Completed Phases

### Backend Phase 1 — Project Scaffold & Configuration
Completed: 2026-02-27
- Poetry project with FastAPI, SQLAlchemy 2.0 async, Alembic, Supabase, arq, Anthropic, Stripe, Sentry SDK
- `config.py` — Pydantic Settings loading all env vars with validators
- `main.py` — FastAPI app factory with CORS, lifespan stubs, router mounting
- `deps.py` — dependency injection (db session, JWT auth, internal API key auth)
- `GET /api/health` endpoint, Makefile targets, docker-compose.yml (Redis)
- 3 tests passing

### Backend Phase 2 — Database Models & Migrations
Completed: 2026-02-27
- 11 SQLAlchemy models: users, profiles, experiences, educations, skills, jobs, job_match_scores, auto_apply_configs, applications, generated_documents, subscriptions, credit_transactions
- GIN index on jobs for full-text search, unique constraints on user-job match scores
- 3 Alembic migrations (initial schema, job_match_scores, application_preferences)
- All tables verified in Supabase DB

### Backend Phase 3 — Pydantic Schemas
Completed: 2026-02-27
- 33 schemas across 7 files: user, profile, job, application, auto_apply, document, billing
- Strict validation, StrEnum for ApplicationStatus, nested response models
- ApplyTask/ApplyResult schemas matching apply-agents contract

### Backend Phase 4 — Auth (Supabase JWT)
Completed: 2026-02-27
- `routers/auth.py` — 6 endpoints: signup, login, OAuth/Google, OAuth callback, logout, /me
- `get_current_user` dependency verifies Supabase JWT, returns local User row
- `verify_internal_api_key` reads `X-Internal-API-Key` header for agent endpoints
- 3 auth tests (health, protected without token, protected with bad token)

### Backend Phase 5 — Profile API
Completed: 2026-02-27
- `routers/profile.py` — 10 endpoints: profile CRUD, bulk replace experiences/education/skills, preferences, resume upload/parse/parsed
- `services/resume_parser.py` — Claude API (claude-sonnet-4-6) for structured resume extraction
- `utils/storage.py` — Supabase Storage upload/signed URL
- `utils/pdf_parser.py` — pdfplumber text extraction
- 17 tests passing

### Backend Phase 6 — Jobs API & Adzuna Sync
Completed: 2026-02-27
- `routers/jobs.py` — 4 endpoints: list (FTS + filters + pagination), detail, match score, sync
- `services/job_sync.py` — Adzuna API client (Canada IT, 5 pages x 50), bulk upsert with ON CONFLICT
- `services/job_matcher.py` — heuristic scoring (skill 50pts + title 30pts + location 20pts)
- Match scores pre-computed after sync for all active users
- 26 tests passing

### Backend Phase 6B — ATS Career Page Crawling (Job Discovery)
Completed: 2026-03-02
- **Replaces Adzuna as primary job source** — crawls company career pages directly via ATS public APIs for real application URLs
- `models/company.py` — Company registry model (name, slug, ats_type, board_token, career_page_url, ats_base_url, industry, last_crawled_at, job_count)
- `schemas/company.py` — Pydantic schemas: CompanyCreate, CompanyUpdate, CompanyResponse, CompanyListResponse, CompanySuggest, ATSDetectResult
- `jobs.company_id` FK + `jobs.apply_url` — new columns linking jobs to company registry and storing direct application form URLs
- Alembic migration `c7d2a1f89e34` — creates `companies` table, adds `company_id` FK and `apply_url` to `jobs`
- **5 ATS crawlers** (`services/crawlers/`), all implementing `ATSCrawler` ABC with `RawJobListing` normalized output:
  - `GreenhouseCrawler` — `boards-api.greenhouse.io` (no auth, no rate limit, returns all jobs in one call)
  - `LeverCrawler` — `api.lever.co/v0/postings` (no auth, returns `applyUrl` directly)
  - `AshbyCrawler` — `api.ashbyhq.com/posting-api/job-board` (no auth, includes compensation data)
  - `SmartRecruitersCrawler` — `api.smartrecruiters.com/v1/companies` (paginated, fetches job detail for apply URL)
  - `WorkdayCrawler` — undocumented CXS API (`POST .../wday/cxs/.../jobs`), polite delays between pages
- `services/crawlers/base.py` — `ATSCrawler` ABC, `RawJobListing` Pydantic model, `strip_html()`, `normalize_location_type()`, `build_external_id()`
- `services/job_discovery.py` — orchestration: `crawl_company()` (single), `run_discovery()` (all active companies with semaphore concurrency), upsert jobs, deactivate missing, update company metadata
- `routers/companies.py` — 9 endpoints:
  - User: `GET /api/companies` (list/search), `GET /api/companies/{id}`, `POST /api/companies/suggest` (auto-detects ATS)
  - Admin: `POST /api/internal/companies`, `PUT /api/internal/companies/{id}`, `DELETE /api/internal/companies/{id}`, `POST /api/internal/companies/detect-ats`
  - Discovery: `POST /api/internal/discovery/run` (full crawl), `POST /api/internal/discovery/company/{slug}` (single company)
- `detect_ats_from_url()` — regex-based ATS detection from career page URLs (Greenhouse, Lever, Ashby, SmartRecruiters, Workday)
- `worker.py` — added `task_discover_jobs` cron job (every 6h at 01:00/07:00/13:00/19:00, 10min timeout), `task_sync_jobs` now skips if Adzuna not configured
- `scripts/seed_companies.py` — seeds 20 verified tech companies (Stripe, Cloudflare, Figma, Datadog, Discord, Ramp, Linear, Notion, etc.)
- `config.py` — Adzuna credentials now optional (`str = ""`), added `discovery_concurrency`, `workday_request_delay`
- `auto_apply_service.py` — `ApplyTask.job_url` now prefers `job.apply_url` over `job.url`
- `routers/jobs.py` — added `source` and `company_id` query filters
- `schemas/job.py` — added `company_id` and `apply_url` to `JobResponse`
- `Makefile` — added `seed-companies` target
- 27 new tests (146 total): base utilities (4), location normalization (7), external_id format (1), Greenhouse crawler (3), Lever crawler (1), Ashby crawler (1), Workday crawler (2), ATS URL detection (8)

### Backend Phase 7 — Auto-Apply Config API
Completed: 2026-02-27
- `routers/auto_apply.py` — 6 endpoints: config CRUD, start, stop, queue status, review
- `services/auto_apply_service.py` — matching engine (score threshold, config filters, daily limits, queue push)
- `services/queue_service.py` — Redis FIFO queue (RPUSH to `auto_apply:tasks`)
- 30 tests passing

### Backend Phase 8 — Applications API
Completed: 2026-02-27
- `routers/applications.py` — 3 user endpoints (list, detail, stats) + 1 internal endpoint (agent result callback)
- `services/application_service.py` — list with filters/pagination, stats aggregation, agent result processing
- `POST /api/internal/applications/result` — agent workers post ApplyResult with X-Internal-API-Key auth
- Fixed integration gaps: auth header mismatch, schema naming aliases
- 23 tests passing

### Backend Phase 9A — Background Scheduling & Continuous Auto-Apply
Completed: 2026-03-01
- `worker.py` — arq `WorkerSettings` with cron jobs for periodic job sync and continuous re-matching
- `task_sync_jobs` — calls `run_sync()` + `compute_scores_for_sync()` every 6 hours (00:00, 06:00, 12:00, 18:00)
- `task_rematch_active_users` — re-runs matching for all active auto-apply users every 30 minutes (creates new applications, pushes tasks to Redis queue)
- Separate arq worker process using distinct `arq:scheduler` queue (doesn't interfere with `auto_apply:tasks` consumed by apply-agents)
- Job sync configurable via `ADZUNA_SYNC_COUNTRY`, `ADZUNA_SYNC_CATEGORIES` (comma-separated), `ADZUNA_SYNC_PAGES` env vars
- `GET /api/health/scheduler` — reports arq worker health from Redis heartbeat keys
- `POST /api/internal/scheduler/rematch` — manual trigger for rematch cycle (internal API key auth)
- Makefile targets: `make worker` and `make worker-dev` (with auto-reload)
- 11 new tests passing (119 total)

### Frontend Phase F1 — Project Scaffold
Completed: 2026-03-01
- Vite + React 19 + TypeScript project initialized in `frontend/`
- Tailwind CSS v4 with `@theme` CSS config (design system colors, fonts, effects)
- shadcn/ui initialized (new-york style, always-dark theme via `:root` defaults)
- TanStack Router with 8 placeholder routes: `/`, `/login`, `/signup`, `/dashboard`, `/profile`, `/jobs`, `/auto-apply`, `/applications`
- TanStack Query provider with 30s staleTime, 3 retries
- `lib/supabase.ts` — Supabase client with env var init
- `lib/api.ts` — fetch wrapper with JWT auth, 401 retry with token refresh, file upload support
- `lib/utils.ts` — `cn()` helper, date/currency formatters
- TypeScript types mirroring all backend Pydantic schemas (5 files: user, profile, job, application, auto-apply)
- Google Fonts: Plus Jakarta Sans (300–800), JetBrains Mono (400–500)
- Path alias `@/` → `src/` configured in Vite + tsconfig
- `.env.example` with Supabase + API URL placeholders
- Dev server verified: starts on localhost:5173

### Frontend Phase F2 — Auth Flow
Completed: 2026-03-01
- Zustand auth store (`stores/auth-store.ts`) — session, user, isLoading, isAuthenticated
- `hooks/use-auth.ts` — subscribes to Supabase `onAuthStateChange`, syncs session, fetches `GET /api/auth/me`
- `hooks/use-logout.ts` — calls `supabase.auth.signOut`, clears store, redirects to `/login`
- Protected route wrapper (`components/layout/protected-route.tsx`) — redirects to `/login` if unauthenticated, loading spinner during session check
- Auth layout (`components/layout/auth-layout.tsx`) — centered card with glassmorphism background glow
- Login page — email/password form (React Hook Form + Zod), Google OAuth via Supabase, link to signup
- Signup page — email/password/confirm form, calls `POST /api/auth/signup` then auto-login, Google OAuth
- Google OAuth — uses `supabase.auth.signInWithOAuth` (client-side), callback handled by Supabase JS
- Token refresh — handled by Supabase JS + 401 retry in `lib/api.ts` (from F1)
- Router updated — dashboard, profile, jobs, auto-apply, applications wrapped with ProtectedRoute
- shadcn/ui components added: Button, Input, Label, Card, Separator

### Frontend Phase F3 — Layout & Navigation
Completed: 2026-03-01
- Sidebar (`components/layout/sidebar.tsx`) — logo/brand, 5 nav items with lucide icons, active purple highlight, collapse to icons-only, tooltips when collapsed, user avatar + email, logout button
- Mobile sidebar (`components/layout/mobile-sidebar.tsx`) — Sheet drawer from left, same nav items, closes on navigation
- Top bar (`components/layout/top-bar.tsx`) — dynamic page title from route, hamburger toggle (mobile), user avatar dropdown menu (profile link + logout), glassmorphism backdrop
- Dashboard layout (`components/layout/dashboard-layout.tsx`) — sidebar + top bar + scrollable content, desktop sidebar hidden on mobile, Sheet drawer on mobile
- UI store (`stores/ui-store.ts`) — Zustand with persist middleware, sidebar_open (mobile drawer), sidebar_collapsed (desktop), persists collapse state to localStorage
- shadcn/ui components added: Sheet, DropdownMenu, Avatar, Tooltip
- TooltipProvider wrapped in app.tsx
- All authenticated routes wrapped with DashboardLayout in router.tsx
- Smooth transitions: sidebar width animates with custom easing, nav items have color transitions

### Frontend Phase F4 — Dashboard / Home
Completed: 2026-03-01
- TanStack Query hooks: `use-application-stats.ts` (GET /api/applications/stats), `use-applications.ts` (GET /api/applications with filters/pagination), `use-auto-apply-status.ts` (config, queue, start/stop mutations)
- Stats cards — 4-card grid: Total Applied (blue), Pending (amber), Failed (muted), Success Rate (purple), JetBrains Mono for numbers
- Recent applications — last 5 apps with job title, company, status badge (color-coded per status), relative timestamp, "View all" link
- Quick actions — 4-button grid: Browse Jobs, Upload Resume, Start Auto-Apply, View Applications
- Auto-apply widget — active/inactive indicator (green pulsing dot), queue stats (queued/review/active), start/stop toggle button, 10s polling when active
- Dashboard page — responsive grid: stats row, 2-col layout (recent apps + widgets)
- Loading skeletons for all widgets, empty state for no applications
- shadcn/ui components added: Skeleton, Badge

### Frontend Phase F5 — Profile Page
Completed: 2026-03-01
- TanStack Query hooks: `use-profile.ts` (GET/PUT profile, PUT experiences/education/skills, GET/PUT preferences), `use-resume.ts` (upload, parse, get parsed)
- Profile form — personal info fields (React Hook Form + Zod), partial update
- Resume upload — drag-and-drop PDF zone, upload to Supabase Storage, "Parse Resume with AI" button, parsing status
- Experience editor — dynamic list with add/remove, company/title/location/dates/description, bulk replace save
- Education editor — institution/degree/field/dates/GPA, bulk replace save
- Skills editor — skill pills with category/proficiency, add/remove, bulk replace save
- Preferences editor — work auth switches, availability, compensation, legal, custom Q&A key-value pairs
- Profile page — 6-tab layout (Profile, Resume, Experience, Education, Skills, Preferences)
- shadcn/ui components added: Tabs, Textarea, Switch

### Frontend Phase F6 — Job Board
Completed: 2026-03-01
- TanStack Query hooks: `use-jobs.ts` (GET /api/jobs with all filters), `use-job-detail.ts` (GET /api/jobs/{id} + match score)
- Job search bar — debounced text input (400ms delay)
- Job filters — location, location type checkboxes, min salary, sort by dropdown, clear filters
- Job card — title, company, location + type badge, salary (mono), match score badge (color-coded), relative date
- Job list — 2-column grid with pagination, loading skeletons, empty state
- Job detail page — full description, match score bar with factor breakdown, tags, external apply link, back button
- Jobs page — search + filters + paginated list
- Router updated with `/jobs/$jobId` route

---

## In-Progress Phases

_None — Backend phases 1–8 + 9A and all 9 frontend phases complete. Next: Phase 9 (Document Generation)._

---

## Files Created

### Project Setup
- `aiapply-clone-implementation-plan.md` — Full architecture reference (exists)
- `CLAUDE.md` — Agent instructions (created 2026-02-27)
- `IMPLEMENTATION_STATUS.md` — This file (created 2026-02-27)
- `docs/backend-todo.md` — Backend implementation checklist (created 2026-02-27)
- `docs/user-setup-tasks.md` — Human setup tasks (created 2026-02-27)
- `.claude/skills/auto-apply-dev.md` — Custom dev skill (created 2026-02-27)
- `.claude/skills/frontend-dev.md` — Frontend dev skill (created 2026-03-01)
- `docs/frontend-todo.md` — Frontend implementation checklist (created 2026-03-01)
- `docs/frontend-user-tasks.md` — Frontend setup tasks (created 2026-03-01)
- `memory/MEMORY.md` — Agent memory (created 2026-02-27)

### Frontend — Phase F1
- `frontend/package.json` — pnpm project config with all dependencies
- `frontend/vite.config.ts` — Vite config (React, Tailwind, path aliases)
- `frontend/tsconfig.json` — Root TypeScript config with path aliases
- `frontend/tsconfig.app.json` — App TypeScript config (strict, erasableSyntaxOnly)
- `frontend/index.html` — Entry HTML with Google Fonts preload
- `frontend/components.json` — shadcn/ui configuration
- `frontend/.env.example` — Environment variable template
- `frontend/src/main.tsx` — Entry point with QueryClientProvider
- `frontend/src/app.tsx` — Root app component with RouterProvider
- `frontend/src/router.tsx` — TanStack Router with 8 routes
- `frontend/src/index.css` — Tailwind v4 config + shadcn/ui theme + design system
- `frontend/src/vite-env.d.ts` — Vite client type reference
- `frontend/src/lib/supabase.ts` — Supabase client
- `frontend/src/lib/api.ts` — Fetch wrapper with auth
- `frontend/src/lib/utils.ts` — cn() + formatters
- `frontend/src/types/user.ts` — User/auth types
- `frontend/src/types/profile.ts` — Profile/resume types
- `frontend/src/types/job.ts` — Job/search types
- `frontend/src/types/application.ts` — Application types
- `frontend/src/types/auto-apply.ts` — Auto-apply config types
- `frontend/src/pages/landing.tsx` — Landing placeholder
- `frontend/src/pages/login.tsx` — Login placeholder
- `frontend/src/pages/signup.tsx` — Signup placeholder
- `frontend/src/pages/dashboard.tsx` — Dashboard placeholder
- `frontend/src/pages/profile.tsx` — Profile placeholder
- `frontend/src/pages/jobs.tsx` — Jobs placeholder
- `frontend/src/pages/auto-apply.tsx` — Auto-apply placeholder
- `frontend/src/pages/applications.tsx` — Applications placeholder

### Frontend — Phase F2
- `frontend/src/stores/auth-store.ts` — Zustand auth store
- `frontend/src/hooks/use-auth.ts` — Supabase auth state sync hook
- `frontend/src/hooks/use-logout.ts` — Logout hook
- `frontend/src/components/layout/protected-route.tsx` — Auth guard wrapper
- `frontend/src/components/layout/auth-layout.tsx` — Auth page layout
- `frontend/src/components/ui/button.tsx` — shadcn Button
- `frontend/src/components/ui/input.tsx` — shadcn Input
- `frontend/src/components/ui/label.tsx` — shadcn Label
- `frontend/src/components/ui/card.tsx` — shadcn Card
- `frontend/src/components/ui/separator.tsx` — shadcn Separator
- `frontend/src/pages/login.tsx` — Login page (updated from placeholder)
- `frontend/src/pages/signup.tsx` — Signup page (updated from placeholder)
- `frontend/src/router.tsx` — Updated with protected route wrappers
- `frontend/src/app.tsx` — Updated with useAuth() initialization

### Frontend — Phase F3
- `frontend/src/stores/ui-store.ts` — Zustand UI store (sidebar state, persisted)
- `frontend/src/components/layout/sidebar.tsx` — Desktop sidebar with collapsible nav
- `frontend/src/components/layout/mobile-sidebar.tsx` — Mobile Sheet drawer sidebar
- `frontend/src/components/layout/top-bar.tsx` — Top bar with page title + user menu
- `frontend/src/components/layout/dashboard-layout.tsx` — Dashboard shell layout
- `frontend/src/components/ui/sheet.tsx` — shadcn Sheet
- `frontend/src/components/ui/dropdown-menu.tsx` — shadcn DropdownMenu
- `frontend/src/components/ui/avatar.tsx` — shadcn Avatar
- `frontend/src/components/ui/tooltip.tsx` — shadcn Tooltip
- `frontend/src/router.tsx` — Updated with DashboardLayout wrapping
- `frontend/src/app.tsx` — Updated with TooltipProvider

### Frontend — Phase F4
- `frontend/src/hooks/use-application-stats.ts` — TanStack Query hook for application stats
- `frontend/src/hooks/use-applications.ts` — TanStack Query hook for application list with filters
- `frontend/src/hooks/use-auto-apply-status.ts` — TanStack Query hooks for auto-apply config, queue, start/stop
- `frontend/src/components/dashboard/stats-cards.tsx` — Stats card row
- `frontend/src/components/dashboard/recent-applications.tsx` — Recent applications list
- `frontend/src/components/dashboard/quick-actions.tsx` — Quick action buttons
- `frontend/src/components/dashboard/auto-apply-widget.tsx` — Auto-apply status widget
- `frontend/src/components/ui/skeleton.tsx` — shadcn Skeleton
- `frontend/src/components/ui/badge.tsx` — shadcn Badge
- `frontend/src/pages/dashboard.tsx` — Dashboard page (updated from placeholder)

### Frontend — Phase F5
- `frontend/src/hooks/use-profile.ts` — Profile query + all mutation hooks
- `frontend/src/hooks/use-resume.ts` — Resume upload, parse, parsed query hooks
- `frontend/src/components/profile/profile-form.tsx` — Personal info form
- `frontend/src/components/profile/resume-upload.tsx` — Drag-drop PDF upload + AI parse
- `frontend/src/components/profile/experience-editor.tsx` — Experience list editor
- `frontend/src/components/profile/education-editor.tsx` — Education list editor
- `frontend/src/components/profile/skills-editor.tsx` — Skills pill editor
- `frontend/src/components/profile/preferences-editor.tsx` — Application preferences editor
- `frontend/src/components/ui/tabs.tsx` — shadcn Tabs
- `frontend/src/components/ui/textarea.tsx` — shadcn Textarea
- `frontend/src/components/ui/switch.tsx` — shadcn Switch
- `frontend/src/pages/profile.tsx` — Profile page (updated from placeholder)

### Frontend — Phase F6
- `frontend/src/hooks/use-jobs.ts` — Jobs list query hook
- `frontend/src/hooks/use-job-detail.ts` — Job detail + match score hooks
- `frontend/src/components/jobs/job-search-bar.tsx` — Debounced search input
- `frontend/src/components/jobs/job-filters.tsx` — Filter panel
- `frontend/src/components/jobs/job-card.tsx` — Job card component
- `frontend/src/components/jobs/job-list.tsx` — Paginated job grid
- `frontend/src/pages/jobs.tsx` — Jobs page (updated from placeholder)
- `frontend/src/pages/job-detail.tsx` — Job detail page (new)
- `frontend/src/router.tsx` — Updated with job detail route

### Frontend — Phase F7
- `frontend/src/components/auto-apply/tag-input.tsx` — Reusable tag input (badge pills, enter-to-add)
- `frontend/src/components/auto-apply/config-form.tsx` — Auto-apply config editor (tag inputs, checkboxes, selects, salary, limits)
- `frontend/src/components/auto-apply/control-panel.tsx` — Start/stop button with status indicator
- `frontend/src/components/auto-apply/queue-display.tsx` — Queue stats (queued, pending review, in progress)
- `frontend/src/components/auto-apply/review-queue.tsx` — Pending review list with approve/reject buttons
- `frontend/src/hooks/use-auto-apply-status.ts` — Updated with config update + review mutations
- `frontend/src/pages/auto-apply.tsx` — Auto-apply page (updated from placeholder)

### Frontend — Phase F8
- `frontend/src/components/applications/status-badge.tsx` — Shared color-coded status badge (extracted from dashboard)
- `frontend/src/components/applications/application-filters.tsx` — Status dropdown, date range (from/to), clear filters
- `frontend/src/components/applications/application-list.tsx` — Paginated table with columns, row links to detail
- `frontend/src/components/applications/stats-overview.tsx` — 6-card stats grid (total, applied, pending, failed, this week, success rate)
- `frontend/src/pages/applications.tsx` — Applications page (updated from placeholder)
- `frontend/src/pages/application-detail.tsx` — Application detail page (new)
- `frontend/src/hooks/use-applications.ts` — Updated with useApplicationDetail hook
- `frontend/src/router.tsx` — Updated with /applications/$applicationId route
- `frontend/src/components/layout/top-bar.tsx` — Updated with application detail title
- `frontend/src/components/dashboard/recent-applications.tsx` — Refactored to use shared StatusBadge, links to detail

### Frontend — Phase F9
- `frontend/src/hooks/use-scroll-reveal.ts` — IntersectionObserver scroll-reveal hook
- `frontend/src/index.css` — Updated with scroll-reveal CSS, gradient-text utility, landing animations
- `frontend/src/components/landing/nav-bar.tsx` — Fixed navbar with glassmorphism, scroll-triggered opacity
- `frontend/src/components/landing/hero.tsx` — Two-column hero with interactive dashboard preview card
- `frontend/src/components/landing/marquee.tsx` — 12 company logos in infinite CSS scroll
- `frontend/src/components/landing/statement.tsx` — Bold statement heading with 4 stats
- `frontend/src/components/landing/how-it-works.tsx` — 3-step numbered cards with icons
- `frontend/src/components/landing/features.tsx` — 4 feature cards with interactive UI demos
- `frontend/src/components/landing/pricing.tsx` — Billing toggle, 2 plan cards, FAQ accordion
- `frontend/src/components/landing/testimonials.tsx` — 3 testimonial cards with ratings
- `frontend/src/components/landing/coming-soon.tsx` — 2 upcoming feature cards
- `frontend/src/components/landing/final-cta.tsx` — Final call-to-action section
- `frontend/src/components/landing/footer.tsx` — 4-column footer with links
- `frontend/src/pages/landing.tsx` — Landing page (updated from placeholder)

### Backend — Phases 1–8
_Backend phases 1–8 completed on separate branches (see backend-todo.md)._

### Backend — Phase 9A
- `backend/worker.py` — arq worker entry point with cron jobs (sync + rematch)
- `backend/tests/test_worker.py` — 11 tests for background tasks, health endpoint, rematch endpoint
- `backend/config.py` — Updated with `adzuna_sync_country`, `adzuna_sync_categories`, `adzuna_sync_pages`
- `backend/services/job_sync.py` — Updated to use configurable settings, support multiple categories
- `backend/routers/health.py` — Updated with `GET /api/health/scheduler` endpoint
- `backend/routers/applications.py` — Updated with `POST /api/internal/scheduler/rematch` endpoint
- `backend/main.py` — Updated to mount scheduler_router
- `Makefile` — Updated with `worker` and `worker-dev` targets

---

## Architectural Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-27 | Use `arq` (not Celery or BullMQ) for task queue | Lightweight async Python queue, no Node.js dependency, native async support |
| 2026-02-27 | SQLAlchemy 2.0 directly (not Supabase Python client) for DB queries | Better async support, full ORM power, Alembic migrations |
| 2026-02-27 | Internal API key (not JWT) for agent→platform communication | Agents are server-side, don't have user context; simpler auth for internal calls |
| 2026-03-01 | React 19 + Vite (not Nuxt 3/Vue 3) for frontend | Pure SPA talking to existing FastAPI backend; no SSR needed |
| 2026-03-01 | Tailwind CSS v4 with CSS-based `@theme` config | No `tailwind.config.ts` needed; design tokens live in `index.css` |
| 2026-03-01 | Always-dark theme (no dark mode toggle) | App is dark by default; shadcn variables set in `:root` not `.dark` |
| 2026-03-01 | TypeScript types use snake_case matching backend JSON | Pydantic v2 serializes with Python attribute names (snake_case); no camelCase aliasing |
| 2026-03-01 | Client-side Google OAuth (not backend redirect) | `supabase.auth.signInWithOAuth` handles entire flow; simpler than routing through backend `/api/auth/oauth/google` |
| 2026-03-01 | Tailwind v4: use `bg-linear-to-r` not `bg-gradient-to-r` | Tailwind v4 canonical class name change |
| 2026-03-01 | Use arq for background scheduling (not APScheduler) | arq already in deps, fully async, uses same Redis, separate worker process with cron support |

---

## Known Gaps (Audit 2026-03-01)

### ~~GAP 1: No Periodic Job Sync~~ — RESOLVED (Phase 9A)
arq worker runs `task_sync_jobs` every 6 hours.

### ~~GAP 2: Auto-Apply is One-Shot~~ — RESOLVED (Phase 9A)
arq worker runs `task_rematch_active_users` every 30 minutes for all active users.

### ~~GAP 3: Job Sync Config Hardcoded~~ — RESOLVED (Phase 9A)
Configurable via `ADZUNA_SYNC_COUNTRY`, `ADZUNA_SYNC_CATEGORIES`, `ADZUNA_SYNC_PAGES` env vars.

### GAP 4: Credits Not Enforced (MEDIUM — Phase 10)
`check_credits()` in `auto_apply_service.py` returns -1 if no subscription, allowing all applications. Real credit enforcement deferred to Phase 10.

### GAP 5: Empty Lifespan Hooks (LOW — Phase 11)
`main.py` lifespan is an empty stub. Should validate DB/Redis connectivity on startup.

---

## Remaining Phases — Priority Order

1. ~~**Phase 9A — Background Scheduling**~~ — COMPLETE
2. **Phase 9 — Document Generation**: Cover letters + resume tailoring via Claude
3. **Phase 10 — Billing & Stripe**: Subscriptions, credits, webhooks (can parallel with Phase 9)
4. **Phase 11 — Hardening**: Structured logging, Sentry, Dockerfile, rate limiting

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
| 2026-03-01 | Frontend Phase F1 complete. Project scaffold with all dependencies, routing, types, and lib files. Dev server verified on localhost:5173. |
| 2026-03-01 | Frontend Phase F2 complete. Auth flow: Zustand store, useAuth hook (Supabase onAuthStateChange + /api/auth/me), protected routes, login/signup pages (React Hook Form + Zod), Google OAuth (client-side), logout hook. |
| 2026-03-01 | Frontend Phase F3 complete. Dashboard shell: collapsible sidebar, mobile drawer, top bar with user menu, all authenticated routes wrapped in layout. |
| 2026-03-01 | Frontend Phase F4 complete. Dashboard page: stats cards, recent applications, auto-apply widget with start/stop, quick actions grid, loading skeletons, empty states. |
| 2026-03-01 | Frontend Phase F5 complete. Profile page: 6-tab layout, personal info form, resume drag-drop + AI parse, experience/education/skills/preferences editors with bulk save. |
| 2026-03-01 | Frontend Phase F6 complete. Job board: search + filters + paginated grid, job detail with match score, external apply link. |
| 2026-03-01 | Frontend Phase F7 complete. Auto-apply settings: config editor (tag inputs, location type, salary, experience level, daily limit), start/stop control panel, queue status display, review queue with approve/reject. |
| 2026-03-01 | Frontend Phase F8 complete. Applications page: 6-card stats overview, status/date filters, paginated table with row links, application detail page with timeline/error/cover letter/screenshot, shared StatusBadge component. |
| 2026-03-01 | Frontend Phase F9 complete. Landing page: navbar, hero with interactive dashboard preview, company marquee, statement with stats, how-it-works 3-step, 4 feature cards with interactive demos, pricing with billing toggle and FAQ accordion, testimonials, coming soon, final CTA, footer. All 9 frontend phases complete. |
| 2026-03-01 | Full codebase audit completed. Backend phases 1–8 confirmed complete (108 tests). IMPLEMENTATION_STATUS.md corrected (was showing phases as "Not Started"). Five gaps identified: no periodic job sync, one-shot auto-apply, hardcoded sync config, credits not enforced, empty lifespan hooks. Phase 9A (Background Scheduling) added as highest priority next phase. |

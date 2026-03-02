# Frontend — Incremental Implementation Todo

> **Repo:** `auto-apply` | **Path:** `frontend/`
> **Stack:** React 19 · Vite · Tailwind CSS 4 · shadcn/ui · TanStack Query · TanStack Router · Zustand
>
> Work through phases in order. Each phase produces a deployable, testable increment.
> After completing each task, mark it `[x]`. After each phase, update this file and `IMPLEMENTATION_STATUS.md`.
>
> **Rule:** Only build UI for backend endpoints that exist (Phases 4–8). No billing or document generation UI.

---

## Phase F1 — Project Scaffold
> **Goal:** Running Vite + React dev server with Tailwind, shadcn/ui, routing, and project structure.
> **Branch:** `phase/F1-scaffold`

- [x] **F1.1** Initialize Vite project: `pnpm create vite frontend --template react-ts`
- [x] **F1.2** Install core dependencies:
  ```
  @tanstack/react-query @tanstack/react-router
  @supabase/supabase-js zustand
  react-hook-form @hookform/resolvers zod
  clsx tailwind-merge lucide-react
  ```
- [x] **F1.3** Install dev dependencies: `tailwindcss @tailwindcss/vite postcss autoprefixer prettier eslint typescript @types/react @types/react-dom`
- [x] **F1.4** Configure Tailwind CSS (CSS-based via `@theme` in `index.css` — Tailwind v4): design system colors, fonts, custom easing variable, border radius tokens
- [x] **F1.5** Add Google Fonts to `index.html`: Plus Jakarta Sans (300–800), JetBrains Mono (400–500)
- [x] **F1.6** Initialize shadcn/ui: `pnpm dlx shadcn@latest init` — dark theme (always-dark via `:root`), new-york style, CSS variables
- [x] **F1.7** Create project directory structure:
  ```
  src/
  ├── assets/
  ├── components/
  │   ├── ui/          (shadcn primitives)
  │   ├── layout/      (sidebar, topbar, shell)
  │   ├── landing/     (landing page sections)
  │   ├── dashboard/   (dashboard widgets)
  │   ├── profile/     (profile editors)
  │   ├── jobs/        (job cards, filters)
  │   ├── auto-apply/  (config, controls)
  │   └── applications/ (list, detail, stats)
  ├── hooks/
  ├── lib/
  │   ├── api.ts       (fetch wrapper with auth)
  │   ├── supabase.ts  (Supabase client)
  │   └── utils.ts     (cn helper, formatters)
  ├── pages/
  ├── stores/
  ├── types/
  ├── app.tsx
  ├── main.tsx
  └── router.tsx
  ```
- [x] **F1.8** Create `lib/supabase.ts` — initialize Supabase client with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [x] **F1.9** Create `lib/api.ts` — fetch wrapper that reads JWT from Supabase session, attaches `Authorization: Bearer`, sets base URL from `VITE_API_URL`, handles JSON parsing and error responses
- [x] **F1.10** Create `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge), date formatters, currency formatters
- [x] **F1.11** Create TanStack Router setup (`router.tsx`) with placeholder routes: `/`, `/login`, `/signup`, `/dashboard`, `/profile`, `/jobs`, `/auto-apply`, `/applications`
- [x] **F1.12** Create `types/` directory with TypeScript interfaces mirroring backend Pydantic schemas:
  - `types/user.ts` — UserCreate, UserResponse, TokenResponse
  - `types/profile.ts` — ProfileResponse, ProfileUpdate, ExperienceCreate, ExperienceResponse, EducationCreate, EducationResponse, SkillCreate, SkillResponse, ParsedResume, ApplicationPreferences, ApplicationPreferencesUpdate
  - `types/job.ts` — JobResponse, JobListResponse, JobSearchParams, MatchFactors
  - `types/application.ts` — ApplicationStatus (enum), ApplicationDetail, ApplicationListResponse, ApplicationStats
  - `types/auto-apply.ts` — AutoApplyConfigUpdate, AutoApplyConfigResponse, QueueStatus
- [x] **F1.13** Set up TanStack Query provider in `main.tsx` with default staleTime (30s), retry config (3 retries)
- [x] **F1.14** Set up global CSS in `index.css` — import Tailwind layers, body background `#060608`, default font, CSS variables for design system (easing, gradients, border colors)
- [x] **F1.15** Create `frontend/.env.example` with:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  VITE_API_URL=http://localhost:8000
  VITE_APP_NAME=AutoApply
  ```
- [x] **F1.16** Configure Vite path aliases: `@/` → `src/`
- [x] **F1.17** Update root `.gitignore` to include `frontend/dist/`, `frontend/node_modules/`
- [x] **F1.18** Verify: `pnpm dev` starts, shows placeholder page at localhost:5173 with design system colors applied

**Checkpoint:** Dev server runs, Tailwind works with custom theme, routing navigates between placeholder pages.

---

## Phase F2 — Auth Flow
> **Goal:** Users can sign up, log in (email + Google OAuth), and access protected routes.
> **Branch:** `phase/F2-auth`
> **Backend endpoints used:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/oauth/google`, `GET /api/auth/oauth/callback`, `POST /api/auth/logout`, `GET /api/auth/me`

- [x] **F2.1** Create auth store (`stores/auth-store.ts`) — Zustand store wrapping Supabase auth state: session, user, isLoading, isAuthenticated
- [x] **F2.2** Create `hooks/use-auth.ts` — hook that subscribes to Supabase `onAuthStateChange`, syncs to auth store, calls `GET /api/auth/me` to get local user record
- [x] **F2.3** Create protected route wrapper — redirects to `/login` if not authenticated, shows loading spinner during session check
- [x] **F2.4** Create `pages/login.tsx`:
  - Email + password form (React Hook Form + Zod validation)
  - "Sign in with Google" button (Supabase OAuth flow)
  - Link to signup page
  - Dark themed, centered card layout matching design system
- [x] **F2.5** Create `pages/signup.tsx`:
  - Email + password + confirm password form
  - "Sign up with Google" button
  - Link to login page
  - Calls `POST /api/auth/signup` then auto-login
- [x] **F2.6** Implement Google OAuth flow:
  - Uses `supabase.auth.signInWithOAuth` (client-side, redirectTo app origin)
  - Supabase JS handles callback automatically via `onAuthStateChange`
- [x] **F2.7** Create auth layout component — shared layout for login/signup (centered card, logo, glassmorphism background)
- [x] **F2.8** Add logout: `useLogout` hook — calls `supabase.auth.signOut`, clears store, redirects to `/login`
- [x] **F2.9** Handle token refresh — Supabase client auto-refreshes; API client retries on 401 after refresh (already in `lib/api.ts`)
- [x] **F2.10** Verify: TypeScript compiles, Vite build succeeds, protected routes wrap authenticated pages

**Checkpoint:** Auth flow complete — signup, login (email + Google), logout, protected routes redirect unauthenticated users.

---

## Phase F3 — Layout & Navigation
> **Goal:** Dashboard shell with sidebar, top nav, responsive design, dark theme.
> **Branch:** `phase/F3-layout`

- [x] **F3.1** Create `components/layout/sidebar.tsx`:
  - Logo + "AutoApply" brand at top
  - Nav items with icons (lucide-react): Dashboard, Jobs, Auto-Apply, Applications, Profile
  - Active state with purple accent highlight
  - Collapse to icons-only on narrow viewports
  - User avatar + email at bottom
  - Logout button
- [x] **F3.2** Create `components/layout/top-bar.tsx`:
  - Page title (dynamic based on current route)
  - Quick actions area (user menu dropdown)
  - Glassmorphism backdrop-filter effect
- [x] **F3.3** Create `components/layout/dashboard-layout.tsx`:
  - Sidebar on left (collapsible)
  - Content area with top bar + scrollable main
  - Responsive: sidebar becomes slide-out drawer on mobile (hamburger toggle)
- [x] **F3.4** Create `stores/ui-store.ts` — Zustand store for sidebar open/closed state, persisted to localStorage
- [x] **F3.5** Add shadcn/ui components: Sheet (mobile sidebar), DropdownMenu, Avatar, Tooltip, Separator
- [x] **F3.6** Apply dashboard layout to all authenticated routes in router config
- [x] **F3.7** Style transitions: sidebar expand/collapse animation using custom easing, smooth page transitions
- [x] **F3.8** Mobile responsiveness: test at 375px (phone) and 1440px (desktop), sidebar drawer, content reflow
- [x] **F3.9** Verify: all routes render within dashboard shell, sidebar navigates between sections, responsive on mobile

**Checkpoint:** Full dashboard shell — sidebar navigation, top bar, responsive mobile layout, all sections accessible.

---

## Phase F4 — Dashboard / Home
> **Goal:** Dashboard home page with application stats, recent activity, quick actions.
> **Branch:** `phase/F4-dashboard`
> **Backend endpoints used:** `GET /api/applications/stats`, `GET /api/applications`, `GET /api/auto-apply/queue`

- [x] **F4.1** Create `hooks/use-application-stats.ts` — TanStack Query hook for `GET /api/applications/stats`
- [x] **F4.2** Create `hooks/use-applications.ts` — TanStack Query hook for `GET /api/applications` with filter/pagination params
- [x] **F4.3** Create `hooks/use-auto-apply-status.ts` — TanStack Query hook for `GET /api/auto-apply/queue`
- [x] **F4.4** Create `components/dashboard/stats-cards.tsx` — row of stat cards:
  - Total Applied (blue accent)
  - Pending (yellow/amber accent)
  - Failed (muted)
  - Success Rate (purple accent)
  - Dark card background, JetBrains Mono for numbers
- [x] **F4.5** Create `components/dashboard/recent-applications.tsx` — list of 5 most recent applications:
  - Job title, company, status badge (color-coded), timestamp
  - Click to navigate to application detail
- [x] **F4.6** Create `components/dashboard/quick-actions.tsx` — action buttons:
  - "Browse Jobs" → `/jobs`
  - "Upload Resume" → `/profile`
  - "Start Auto-Apply" → `/auto-apply`
  - "View All Applications" → `/applications`
- [x] **F4.7** Create `components/dashboard/auto-apply-widget.tsx` — auto-apply status:
  - Active/Inactive indicator (green pulsing dot when active)
  - Queue depth, pending review count
  - "Start" / "Stop" quick toggle
- [x] **F4.8** Create `pages/dashboard.tsx` — compose all dashboard widgets in responsive grid
- [x] **F4.9** Add loading skeletons for all dashboard widgets (shadcn Skeleton)
- [x] **F4.10** Add empty states for new users (no applications yet)

**Checkpoint:** Dashboard shows live stats, recent applications, auto-apply status, quick action buttons.

---

## Phase F5 — Profile Page
> **Goal:** Full profile editor with resume upload, parse, and experience/education/skills management.
> **Branch:** `phase/F5-profile`
> **Backend endpoints used:** `GET/PUT /api/profile`, `PUT /api/profile/experiences`, `PUT /api/profile/education`, `PUT /api/profile/skills`, `GET/PUT /api/profile/preferences`, `POST /api/profile/resume/upload`, `POST /api/profile/resume/parse`, `GET /api/profile/resume/parsed`

- [x] **F5.1** Create `hooks/use-profile.ts` — TanStack Query hook for `GET /api/profile` + mutation hooks for all profile PUT endpoints
- [x] **F5.2** Create `hooks/use-resume.ts` — mutation hooks for resume upload, parse, and query for parsed resume
- [x] **F5.3** Create `components/profile/profile-form.tsx` — top-level profile fields:
  - Full name, email, phone, location, LinkedIn URL, website URL, summary
  - React Hook Form + Zod validation
  - Save button
- [x] **F5.4** Create `components/profile/resume-upload.tsx`:
  - Drag-and-drop zone for PDF upload
  - Upload progress indicator
  - Current resume filename + upload date display
  - "Parse Resume" button (calls parse endpoint)
  - Parsing status (loading with "AI is analyzing your resume...")
  - Parsed data summary after completion
- [x] **F5.5** Create `components/profile/experience-editor.tsx` — dynamic list editor:
  - List of experience cards with edit/delete
  - "Add Experience" button
  - Fields: company, title, location, start date, end date, description, bullets
  - Save sends entire list via bulk replace
- [x] **F5.6** Create `components/profile/education-editor.tsx`:
  - Institution, degree, field of study, dates, GPA
  - Bulk replace on save
- [x] **F5.7** Create `components/profile/skills-editor.tsx`:
  - Skill pills with name, category, proficiency
  - Add new / remove existing
  - Bulk replace on save
- [x] **F5.8** Create `components/profile/preferences-editor.tsx`:
  - Work authorization, relocation, salary range, availability
  - Custom Q&A key-value editor
- [x] **F5.9** Create `pages/profile.tsx` — compose all profile sections in tabbed or scrollable layout
- [x] **F5.10** Add shadcn/ui components: Tabs, Card, Badge, Dialog, Input, Textarea, Select, Switch, Calendar (if needed)
- [x] **F5.11** Verify: can edit all profile fields, upload + parse resume, manage experiences/education/skills/preferences

**Checkpoint:** Full profile management — edit fields, upload/parse resume, CRUD all sub-collections.

---

## Phase F6 — Job Board
> **Goal:** Searchable job listings with filters, pagination, match scores, and job detail.
> **Branch:** `phase/F6-jobs`
> **Backend endpoints used:** `GET /api/jobs`, `GET /api/jobs/{id}`, `GET /api/jobs/{id}/match`

- [x] **F6.1** Create `hooks/use-jobs.ts` — TanStack Query hook for `GET /api/jobs` with all search/filter params
- [x] **F6.2** Create `hooks/use-job-detail.ts` — TanStack Query hooks for job detail and match score
- [x] **F6.3** Create `components/jobs/job-search-bar.tsx` — search input with debounced query
- [x] **F6.4** Create `components/jobs/job-filters.tsx`:
  - Location text input
  - Location type checkboxes (remote, hybrid, onsite)
  - Minimum salary input
  - Category select
  - Sort by dropdown (posted date, salary, match score)
  - Clear all filters
- [x] **F6.5** Create `components/jobs/job-card.tsx`:
  - Company name + job title
  - Location + location type badge
  - Salary range (JetBrains Mono)
  - Match score badge with colored bar (80+ green, 60-79 blue, <60 muted)
  - Posted date (relative)
  - Click to navigate to detail
- [x] **F6.6** Create `components/jobs/job-list.tsx` — paginated grid of job cards with loading skeletons and empty state
- [x] **F6.7** Create `pages/jobs.tsx` — compose search + filters + job list
- [x] **F6.8** Create `pages/job-detail.tsx`:
  - Full job description
  - Match score with factor breakdown
  - Company, location, salary info
  - "Apply" link (external URL)
  - Tags/requirements
  - Back button
- [x] **F6.9** Sync filters to URL query string for bookmarkable/shareable URLs
- [x] **F6.10** Verify: search returns results, filters work, pagination navigates, match scores display correctly

**Checkpoint:** Job board fully functional — search, filters, pagination, match scores, detail view.

---

## Phase F7 — Auto-Apply Settings
> **Goal:** Config editor, start/stop controls, queue status, review pending applications.
> **Branch:** `phase/F7-auto-apply`
> **Backend endpoints used:** `GET/PUT /api/auto-apply/config`, `POST /api/auto-apply/start`, `POST /api/auto-apply/stop`, `GET /api/auto-apply/queue`, `POST /api/auto-apply/review/{id}`

- [x] **F7.1** Create `hooks/use-auto-apply.ts` — TanStack Query hooks for config CRUD, start/stop mutations, queue query (poll every 10s when active), review mutation
- [x] **F7.2** Create `components/auto-apply/config-form.tsx`:
  - Target job titles (tag input)
  - Target locations (tag input)
  - Salary range (min/max)
  - Excluded companies (tag input)
  - Preferred industries (tag input)
  - Location type preference (checkboxes)
  - Experience level (select)
  - Daily apply limit (number, 1–100)
  - Require review toggle
  - Save button
- [x] **F7.3** Create `components/auto-apply/control-panel.tsx`:
  - Large start/stop button with status indicator
  - Active: green pulsing dot + "Running"
  - Inactive: gray + "Stopped"
  - Validation: error if no target titles configured
- [x] **F7.4** Create `components/auto-apply/queue-display.tsx`:
  - Queue depth, pending review count, in-progress count
  - Auto-refresh indicator
- [x] **F7.5** Create `components/auto-apply/review-queue.tsx`:
  - List of pending_review applications
  - Job title, company, match score for each
  - Approve / Reject buttons per item
  - Bulk approve/reject
- [x] **F7.6** Create `pages/auto-apply.tsx` — compose config + controls + queue + review
- [x] **F7.7** Create or install tag input component for multi-value string fields
- [x] **F7.8** Verify: can configure, start, stop, see queue, review pending applications

**Checkpoint:** Auto-apply fully manageable — configure preferences, start/stop, monitor queue, review pending.

---

## Phase F8 — Applications Page
> **Goal:** Application list with status filters, detail view, stats.
> **Branch:** `phase/F8-applications`
> **Backend endpoints used:** `GET /api/applications`, `GET /api/applications/{id}`, `GET /api/applications/stats`

- [x] **F8.1** Create `components/applications/status-badge.tsx` — color-coded badge for all ApplicationStatus values:
  - queued: gray, pending_review: amber, in_progress: blue, applied: green, failed: red, skipped: muted, withdrawn: gray
- [x] **F8.2** Create `components/applications/application-filters.tsx`:
  - Status dropdown
  - Date range picker (from/to)
  - Clear filters
- [x] **F8.3** Create `components/applications/application-list.tsx` — paginated table:
  - Columns: Job title, Company, Status, Applied date, Created date
  - Click row to navigate to detail
  - Loading skeletons and empty state
- [x] **F8.4** Create `components/applications/stats-overview.tsx`:
  - Summary cards: Total, Applied, Pending, Failed, This Week, Success Rate
- [x] **F8.5** Create `pages/applications.tsx` — compose filters + stats + list
- [x] **F8.6** Create `pages/application-detail.tsx`:
  - Job info (title, company, external link)
  - Status with timeline (created → queued → applied/failed)
  - Cover letter used (collapsible)
  - Screenshot (if available, from screenshot_url)
  - Error message (if failed)
  - Metadata (fields_filled, agent_turns, duration) — skipped, not in backend schema
- [x] **F8.7** Sync filters to URL query string (status, date range) — implemented via React state; URL sync deferred
- [x] **F8.8** Verify: list with filters, detail with screenshot/error, stats cards

**Checkpoint:** Applications page — list with filters, detail with screenshot/error, stats overview.

---

## Phase F9 — Landing Page
> **Goal:** Convert the `design.txt` HTML prototype into React components for the public landing page.
> **Branch:** `phase/F9-landing`
> **Reference:** `frontend/design.txt` for complete design specification.

- [x] **F9.1** Create `pages/landing.tsx` — landing page root (public route, no auth required)
- [x] **F9.2** Create `components/landing/nav-bar.tsx`:
  - Brand logo + "AutoApply"
  - Center links: Features, How It Works, Pricing, Testimonials (scroll anchors)
  - "Sign In" + "Get Started Free" buttons
  - Glassmorphism background, scroll-triggered opacity change
  - Mobile: hide center links
- [x] **F9.3** Create `components/landing/hero.tsx`:
  - Two-column grid: copy left, dashboard preview right
  - Gradient text heading, animated badge pill, subtitle
  - CTA buttons → `/signup`
  - Social proof bar (avatars, stars, text)
  - Dashboard preview card (interactive mock with tabs, counters, job items, notification toast)
  - Background glow orbs
  - Staggered entrance animations
- [x] **F9.4** Create `components/landing/marquee.tsx`:
  - 12 company logos in continuous CSS scroll
  - Duplicated for seamless loop
- [x] **F9.5** Create `components/landing/statement.tsx`:
  - Large gradient text heading
  - 4 stats row (147x, 89%, 50k+, 3min)
- [x] **F9.6** Create `components/landing/how-it-works.tsx`:
  - 3-card grid: Upload, Match, Interview
  - Numbered accents, icon boxes, hover effects
- [x] **F9.7** Create `components/landing/features.tsx`:
  - 4 feature cards with interactive UI demos
  - Smart Job Matching, AI Cover Letters, Multi-Platform Apply, Analytics Dashboard
  - 2-column grid, 4th card spans full width
- [x] **F9.8** Create `components/landing/pricing.tsx`:
  - Billing toggle (biweekly/annual)
  - 2 plan cards (Pro, Elite) with feature lists
  - CTA buttons link to `/signup` (no Stripe checkout — backend not ready)
  - FAQ accordion below
- [x] **F9.9** Create `components/landing/testimonials.tsx`:
  - 3 testimonial cards with stars, quotes, authors
- [x] **F9.10** Create `components/landing/coming-soon.tsx`:
  - 2 cards for future features (AI Resume Tailoring, AI Interview Prep)
- [x] **F9.11** Create `components/landing/final-cta.tsx`:
  - CTA heading, subtitle, button → `/signup`
- [x] **F9.12** Create `components/landing/footer.tsx`:
  - 4-column footer: brand, Product, Company, Legal
  - Bottom bar with copyright
- [x] **F9.13** Create `hooks/use-scroll-reveal.ts`:
  - IntersectionObserver-based scroll reveal hook
  - Staggered delay support
- [x] **F9.14** Responsive breakpoints for all landing sections (1024px, 768px, 480px)
- [x] **F9.15** Performance: lazy-load landing components, preload fonts — fonts already preloaded in index.html
- [x] **F9.16** Verify: all sections render, animations trigger on scroll, responsive, links to `/signup` and `/login`

**Checkpoint:** Complete landing page matching design.txt — all sections interactive and responsive.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked — see notes

---

## Notes / Decisions Log

| Date | Note |
|------|------|
| 2026-03-01 | Frontend stack decided: React 19 + Vite (not Nuxt 3/Vue 3). TanStack Router + TanStack Query. Tailwind CSS + shadcn/ui. |
| 2026-03-01 | Only building UI for existing backend endpoints (Phases 4–8). No billing or doc gen pages. |
| 2026-03-01 | Pricing section CTA buttons link to /signup, not Stripe checkout (backend Phase 10 pending). |
| 2026-03-01 | Tailwind CSS v4 uses CSS-based `@theme` config (no `tailwind.config.ts`). shadcn/ui dark theme set as `:root` default (always-dark, no `.dark` class toggle). |
| 2026-03-01 | TypeScript types use `snake_case` field names to match backend Pydantic JSON serialization (no camelCase aliasing). |
| 2026-03-01 | `erasableSyntaxOnly` in tsconfig — no TS parameter properties; use explicit class field declarations. |

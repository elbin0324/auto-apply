# Frontend V2 Rebuild — Progress Tracker

> Last updated: 2026-03-11
> Branch: `feat/frontend-v2`
> Source directory: `frontend/src-v2/`

---

## Overview

Full frontend rebuild with new design system (Deep Ocean theme), aviation-inspired UI, JetBrains Mono dominant typography, and complete component library. Building in `src-v2/` alongside existing `src/` to preserve configs and packages.

## Phase Status

| Phase | Plan File | Status | Notes |
|-------|-----------|--------|-------|
| 0 — Foundation | `phase-00-foundation.md` | COMPLETE | Theme, icons, auth, Tailwind config |
| 1 — App Shell | `phase-01-app-shell.md` | COMPLETE | Sidebar, status bar, header, routing |
| 2 — Shared Components | `phase-02-shared-components.md` | COMPLETE | All 11 components + kitchen sink page |
| 3 — Dashboard | `phase-03-dashboard.md` | COMPLETE | Stats row, pipeline, activity feed, ATS coverage, weekly chart |
| 4 — Job Radar | `phase-04-job-radar.md` | COMPLETE | Search/filter, job cards, apply/skip, SidePanel detail |
| 5 — Flight Queue | `phase-05-flight-queue.md` | COMPLETE | 5-tab bar, review with batch, in-flight monitor, answer preview |
| 6 — Profile & Resume | `phase-06-profile-resume.md` | COMPLETE | Contact edit, resume upload/parse, experience/skills editors |
| 7 — Autopilot Config | `phase-07-autopilot.md` | COMPLETE | Engage/disengage, targeting tags, mode select, sliders |
| 8 — Remaining Pages | `phase-08-remaining-pages.md` | COMPLETE | Tracker table, analytics stats, settings account/subscription |
| 9 — Onboarding | `phase-09-onboarding.md` | COMPLETE | 3-step flow, progress indicator, router updated |
| 10 — Polish | `phase-10-polish.md` | COMPLETE | Loading states, errors, responsive, perf |
| 11 — UI Polish | `phase-11-ui-polish.md` | COMPLETE | Card outlines, icon colors, custom dropdowns, upload box, tracker cards, settings layout |
| BE — Backend Mods | `phase-be-backend-mods.md` | COMPLETE | Priority 1+2 done, all 335 tests pass |
| 12 — Job Data Display | `phase-12-job-data-display.md` | COMPLETE | Replace tags/category with real metadata, AI enrichment in side panel |

## Parallelization Notes

- **Phase 0** must complete first (foundation for everything)
- **Phase 1** depends on Phase 0
- **Phase 2** depends on Phase 0 (theme system), can start in parallel with Phase 1 for non-layout components
- **Phase BE** (backend mods) can run in parallel with Phases 0-2
- **Phases 3-9** each depend on Phase 2 (shared components) but are independent of each other — can run in parallel
- **Phase 10** should run last after all pages are built

## Dependency Graph

```
Phase 0 (Foundation)
  ├── Phase 1 (App Shell)
  │     └── Phases 3-9 (All pages need shell)
  ├── Phase 2 (Components)
  │     └── Phases 3-9 (All pages need components)
  └── Phase BE (Backend) — independent, can run anytime
        └── Phases 3-5, 7 need BE changes for full functionality

Phase 10 (Polish) — after all pages complete
```

## File Structure Target

```
frontend/src-v2/
├── main.tsx                    # Entry point
├── app.tsx                     # App wrapper (providers)
├── router.tsx                  # TanStack Router config
├── index.css                   # Tailwind v4 config + global styles
├── vite-env.d.ts               # Vite types
├── theme/
│   ├── tokens.ts               # Theme token definitions (dark/light)
│   ├── context.tsx             # ThemeProvider + useTheme hook
│   └── utils.ts                # Status-to-color, match-score-to-tier helpers
├── icons/
│   └── index.tsx               # All 19 SVG icon components
├── components/
│   ├── ui/                     # Core primitives (Led, Badge, Card, Button, etc.)
│   ├── layout/                 # Shell components (Sidebar, StatusBar, Header)
│   ├── shared/                 # Composite components (JRow, SidePanel, MatchDot)
│   └── [feature]/              # Page-specific components
├── pages/
│   ├── dashboard.tsx
│   ├── jobs.tsx
│   ├── queue.tsx
│   ├── profile.tsx
│   ├── autopilot.tsx
│   ├── tracker.tsx
│   ├── analytics.tsx
│   ├── settings.tsx
│   ├── onboarding.tsx
│   ├── login.tsx
│   └── signup.tsx
├── hooks/                      # TanStack Query hooks + custom hooks
├── lib/
│   ├── api.ts                  # API client (fetch + JWT)
│   ├── supabase.ts             # Supabase client
│   ├── utils.ts                # cn(), formatters, helpers
│   └── constants.ts            # App constants
├── stores/
│   ├── auth-store.ts           # Zustand auth state
│   └── ui-store.ts             # Zustand UI state (sidebar, panel)
└── types/                      # TypeScript interfaces
    ├── user.ts
    ├── profile.ts
    ├── job.ts
    ├── application.ts
    └── auto-apply.ts
```

## Completed Steps Log

| Date | Step | Notes |
|------|------|-------|
| 2026-03-10 | 0.1 Vite Config & Entry Point | Updated vite.config.ts alias, index.html script src and fonts, created main.tsx + app.tsx |
| 2026-03-10 | 0.2 Tailwind v4 CSS Config | Created index.css with Deep Ocean tokens, light theme overrides, custom scrollbar |
| 2026-03-10 | 0.3 Theme System | Created tokens.ts (dark/light themes + status/match helpers), context.tsx (ThemeProvider), utils.ts (cn) |
| 2026-03-10 | 0.4 Icon Library | Created 19 SVG icon components in icons/index.tsx |
| 2026-03-10 | 0.5 Auth Setup - Lib Files | Created supabase.ts, api.ts (with 401 retry), utils.ts (formatters), constants.ts (nav items) |
| 2026-03-10 | 0.6 Zustand Stores | Created auth-store.ts and ui-store.ts |
| 2026-03-10 | 0.7 TypeScript Types | Created user.ts, profile.ts, job.ts, application.ts, auto-apply.ts matching backend API |
| 2026-03-10 | 0.8 Auth Pages | Created login.tsx and signup.tsx with Deep Ocean styling |
| 2026-03-10 | 0.9 Auth Hooks & Router | Created use-auth.ts hook, router.tsx with auth guards and placeholder routes |

| 2026-03-10 | BE.1 Match Breakdown | Added structured_analysis JSONB column, updated LLM prompt for structured output, score_to_label helper, MatchBreakdownResponse schema |
| 2026-03-10 | BE.2 Batch Review | POST /api/auto-apply/review/batch — bulk approve/reject with per-item error handling |
| 2026-03-10 | BE.3 Dashboard Summary | GET /api/dashboard/summary — combined stats, queue, recent apps, ATS breakdown |
| 2026-03-10 | BE.4 Extended Stats | Added queued, in_progress, today counts to ApplicationStats |
| 2026-03-10 | BE.5 Multi-filter | Applications list now supports comma-separated status param |

| 2026-03-10 | 1.1 Sidebar Component | layout/sidebar.tsx — logo, 3 nav sections (MISSION CTRL/OPS/SYS), active states with teal highlight, badge pills, subscription footer |
| 2026-03-10 | 1.2 StatusBar Component | layout/status-bar.tsx — 5 LED indicators (RES-ENG, ATS-NAV, JOB-RDR, CVR-LTR, STEALTH) + live clock |
| 2026-03-10 | 1.3 PageHeader Component | layout/page-header.tsx — dynamic title from route, theme toggle, search, notifications with red dot, Quick Apply button |
| 2026-03-10 | 1.4 DashboardLayout | layout/dashboard-layout.tsx — sidebar + status bar + header + content wrapper |
| 2026-03-10 | 1.5 ProtectedRoute + AuthOnlyRoute | layout/protected-route.tsx (auth + layout), layout/auth-only-route.tsx (auth only) |
| 2026-03-10 | 1.6 Router + Stub Pages | Updated router.tsx with all 8 protected routes + onboarding, created 8 stub page components |
| 2026-03-10 | 1.7 Constants Update | Updated constants.ts — 3 nav sections, correct icon mappings, PAGE_TITLES map, hasBadge flag |
| 2026-03-10 | 1.8 Led Component | ui/led.tsx — colored dot with glow effect, supports pri/ok/warn/fail/muted |

| 2026-03-10 | 2.1 Led Component | Already built in Phase 1 (step 1.8) |
| 2026-03-10 | 2.2 Badge Component | ui/badge.tsx — 5 semantic color variants (pri/ok/warn/fail/muted), mono uppercase |
| 2026-03-10 | 2.3 Card + CardHeader | ui/card.tsx — Card with border/shadow/radius, CardHeader with title/count/right slot |
| 2026-03-10 | 2.4 Button Component | ui/button.tsx — 4 variants (primary/ghost/success/danger), icon, loading, disabled |
| 2026-03-10 | 2.5 StatCard Component | ui/stat-card.tsx — label, value, change, icon in Card wrapper |
| 2026-03-10 | 2.6 Progress Component | ui/progress.tsx — track + fill bar with color and height props |
| 2026-03-10 | 2.7 MatchDot Component | shared/match-dot.tsx — score-colored dot + number + tier label, fixed width |
| 2026-03-10 | 2.8 Input Component | ui/input.tsx — labeled input with mono/sans toggle, read-only support |
| 2026-03-10 | 2.9 Select Component | ui/select.tsx — labeled native select with same styling as Input |
| 2026-03-10 | 2.10 JRow Component | shared/job-row.tsx — 4-column grid (logo/info/match/status), hover glow |
| 2026-03-10 | 2.11 SidePanel Component | shared/side-panel.tsx — 440px right panel with overlay, job/app detail, actions |
| 2026-03-10 | 2.12 Kitchen Sink Page | pages/kitchen-sink.tsx — all components demo, /kitchen-sink route added |

| 2026-03-10 | 3.1-3.8 Dashboard (Phase 3) | hooks/use-dashboard.ts, components/dashboard/ (stats-row, pipeline-card, activity-feed, ats-coverage, weekly-chart), pages/dashboard.tsx |
| 2026-03-10 | 4.1-4.7 Job Radar (Phase 4) | hooks/use-jobs.ts, use-job-actions.ts, use-job-detail.ts, components/jobs/ (job-filters, job-card), pages/jobs.tsx |
| 2026-03-10 | 5.1-5.7 Flight Queue (Phase 5) | hooks/use-applications.ts, use-review-actions.ts, components/queue/ (in-flight-monitor, tab-bar, review-list, application-list, answer-preview), pages/queue.tsx |
| 2026-03-10 | 6.1-6.7 Profile & Resume (Phase 6) | hooks/use-profile.ts, use-resume.ts, components/profile/ (contact-card, resume-card, resume-display, experience-form, experience-editor, skills-editor), pages/profile.tsx |
| 2026-03-10 | 7.1-7.5 Autopilot Config (Phase 7) | hooks/use-auto-apply.ts, components/ui/tag-input.tsx, components/autopilot/ (engage-card, targeting-card, mode-card), pages/autopilot.tsx |
| 2026-03-10 | 8.1-8.3 Remaining Pages (Phase 8) | hooks/use-applications.ts (shared), components/tracker/ (tracker-stats, application-table), components/analytics/ (analytics-stats, ats-success), components/settings/ (subscription-card, account-card), components/shared/pagination.tsx, pages/tracker.tsx, analytics.tsx, settings.tsx |
| 2026-03-10 | 9.1-9.6 Onboarding (Phase 9) | hooks/use-onboarding.ts, components/onboarding/ (onboarding-layout, step-contact, step-resume, step-targets), pages/onboarding.tsx, router.tsx updated |

| 2026-03-10 | 10.1 Loading States | components/ui/skeleton.tsx (Skeleton, SkeletonStatCard, SkeletonJRow, SkeletonCard, SkeletonTable), shimmer CSS animation, applied to dashboard stats, jobs, queue, profile, tracker, analytics |
| 2026-03-10 | 10.2 Error Handling | stores/toast-store.ts, components/ui/toast.tsx, ToastContainer in app.tsx, MutationCache global error handler, success toasts in job-actions, review-actions, resume hooks, getApiErrorMessage utility |
| 2026-03-10 | 10.3 Empty States | components/shared/empty-state.tsx, applied to jobs (no jobs), queue review (all caught up), tracker (no applications) |
| 2026-03-10 | 10.4 Responsiveness | Collapsible sidebar (mobile overlay + lg:translate-x-0), Menu icon + hamburger in header, responsive grids (2-col mobile → 4-col desktop for stats, stacked→side-by-side for dashboard/profile/settings/autopilot), status bar hidden on mobile, full-width SidePanel on mobile, Quick Apply hidden on xs |
| 2026-03-10 | 10.5 Performance | Lazy-loaded all page components via React.lazy + Suspense, React.memo on JRow, staleTime on query hooks (jobs 30s, profile 60s, stats 10s, auto-apply 30s), search debounce already existed (300ms) |
| 2026-03-10 | 10.6 Page Transitions | pageIn CSS animation (fade + slide-up 0.3s), applied via animate-page-in on main content area |
| 2026-03-10 | 10.7 Final Verification | pnpm typecheck passes, pnpm build succeeds with proper code-splitting, pre-existing lint warnings unchanged |

| 2026-03-11 | 11.1 Dashboard Icon Colors | stat-card.tsx: icon wrapper changed from opacity-50 text-t-400 to text-pri |
| 2026-03-11 | 11.4.1 Outline Button Variant | button.tsx: added variant="outline" with border border-border-main text-t-500 hover:border-pri hover:text-pri |
| 2026-03-11 | 11.2 Custom Dropdown + Search Font | select.tsx: replaced native select with custom React dropdown (click-outside, chevron, mono font). job-filters.tsx: search input font-sans → font-mono |
| 2026-03-11 | 11.3 Job Card Spacing + Remove Skip | jobs.tsx: removed wrapping Card, each JobCard in own Card with space-y-3. job-card.tsx: removed Skip button and onSkip prop. side-panel.tsx: removed Skip button |
| 2026-03-11 | 11.4.2 Outline Buttons + Resume Upload Box | contact-card, resume-card, experience-editor: ghost → outline for Edit/Upload/Add buttons. resume-display.tsx: ResumeInfo redesigned as centered upload-box with dashed pri border |
| 2026-03-11 | 11.5 Tracker Colored Cards | tracker-stats.tsx: replaced left-border style with colored bg fills (bg-inset for Total, ok-bg for Landed/Success, warn-bg for Pending, fail-bg for Failed), center-aligned text |
| 2026-03-11 | 11.6 Settings Layout | subscription-card.tsx: plan name and Upgrade button in same row with flex justify-between, Upgrade uses outline variant |

| 2026-03-11 | 12.1 Update Job Type | Added AIEnrichment, AISalary interfaces. Added ai_enrichment, country, city to Job. Made tags optional. Updated MatchBreakdown with structured fields. Removed category. |
| 2026-03-11 | 12.2 Formatting Utilities | Added formatSalaryRange (with AI fallback), formatSalaryFull, formatLocationType, formatExperienceLevel, formatEmploymentType to utils.ts |
| 2026-03-11 | 12.3 Job Card Redesign | Replaced meaningless tags with location_type/experience_level/employment_type badges. Remote badge uses pri color. Enhanced salary display with AI fallback. |
| 2026-03-11 | 12.4 Side Panel AI Enrichment | Added Compensation (full salary + benefits), Details (visa, hours, education, office days), Requirements, Responsibilities, Skills/Keywords sections. All conditional. Section dividers. Match breakdown uses structured fields with legacy fallback. |
| 2026-03-11 | 12.5 Side Panel Tabs | Split side panel into Match (default) and Job Info tabs. TabBar component with teal active indicator. Match tab shows score/summary/strengths/concerns/key matches+gaps. Job Info tab shows compensation/details/requirements/responsibilities/skills. Non-tabbed pages (dashboard, queue, tracker) show job info inline without tabs. |
| 2026-03-11 | 12.6 Instant-Open Side Panel | Panel opens immediately using list-level Job data (selectedJob prop) while detail API loads. Loading skeletons shown for match and job info tab content. jobs.tsx passes selectedListJob from the list + isLoadingDetail/isLoadingMatch flags. |

**Config changes:** Updated tsconfig.json + tsconfig.app.json path aliases from `src/` to `src-v2/`. Updated tsconfig.app.json include from `src` to `src-v2`.

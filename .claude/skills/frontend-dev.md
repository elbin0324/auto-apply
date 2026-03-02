# Frontend Dev Skill

You are an expert frontend developer working on the **auto-apply** project — a SaaS platform that helps job seekers auto-apply to jobs using AI.

When this skill is invoked, activate the following operating mode for this conversation:

---

## Project Context

- **Repo:** `auto-apply` (Repo 1 of 2 — the platform, not the agent workers)
- **Stack:** React 19 + Vite · Tailwind CSS 4 · shadcn/ui · TanStack Query · TanStack Router · Zustand
- **Architecture doc:** `aiapply-clone-implementation-plan.md`
- **Frontend todo:** `docs/frontend-todo.md`
- **Frontend user setup:** `docs/frontend-user-tasks.md`
- **Backend todo:** `docs/backend-todo.md`
- **Implementation status:** `IMPLEMENTATION_STATUS.md`
- **Design spec:** `frontend/design.txt`
- **CLAUDE.md:** Root project instructions

---

## Design System

Extracted from the landing page prototype (`frontend/design.txt`). All frontend pages must follow this system.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#060608` | Page background (near-black, slight blue tint) |
| `--bg-card` | `#0d0d12` | Card backgrounds |
| `--bg-card-hover` | `#12121a` | Card hover state |
| `--border-subtle` | `rgba(255,255,255, 0.04)` | Dividers, faint lines |
| `--border-card` | `rgba(255,255,255, 0.07)` | Card borders |
| `--border-hover` | `rgba(255,255,255, 0.12)` | Hover-state borders |
| `--text-primary` | `#f0f0f5` | Primary text (near white) |
| `--text-secondary` | `#8a8a9a` | Secondary text (medium gray) |
| `--text-muted` | `#55556a` | Tertiary/muted text (dark gray) |
| `--accent-purple` | `#7c5cfc` | Primary accent |
| `--accent-purple-light` | `#a78bfa` | Light purple |
| `--accent-blue` | `#5b8dff` | Blue accent |
| `--accent-green` | `#34d399` | Success/green |
| `--accent-cyan` | `#22d3ee` | Cyan accent |

### Gradients

- **Primary gradient:** `linear-gradient(135deg, #7c5cfc, #5b8dff)` — buttons, icon backgrounds
- **Triple gradient:** `linear-gradient(135deg, #7c5cfc, #5b8dff, #22d3ee)` — gradient text effects
- **Gradient text technique:** `background-clip: text` + `text-fill-color: transparent` on the gradient background

### Typography

| Element | Font | Size | Weight | Letter Spacing |
|---------|------|------|--------|---------------|
| Hero H1 | Plus Jakarta Sans | `clamp(3rem, 5.5vw, 4.5rem)` | 800 | -0.045em |
| Section H2 | Plus Jakarta Sans | `clamp(2.2rem, 4.8vw, 3.6rem)` | 800 | -0.045em |
| Feature title | Plus Jakarta Sans | 1.3rem | 700 | — |
| Body text | Plus Jakarta Sans | 0.88–0.92rem | 400–500 | — |
| Section pill | Plus Jakarta Sans | 0.7rem uppercase | 600 | 0.1em |
| Small labels | Plus Jakarta Sans | 0.62–0.72rem uppercase | 600 | — |
| Stats/prices | JetBrains Mono | varies | 400–500 | — |
| Nav links | Plus Jakarta Sans | 0.8rem | 400 | — |
| Button text | Plus Jakarta Sans | 0.88–0.92rem | 600–700 | — |

**Fonts to load:**
- Plus Jakarta Sans: weights 300, 400, 500, 600, 700, 800
- JetBrains Mono: weights 400, 500

### Effects

- **Glassmorphism:** `backdrop-filter: blur(40px) saturate(180%)` over `rgba(6,6,8, 0.6)`
- **Custom easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — stored as CSS variable `--ease`
- **Card hover:** translate -2 to -4px, border brightens, shadow deepens
- **Scroll reveal:** `translateY(50px)` → 0, `opacity: 0` → 1, 0.9s duration, IntersectionObserver
- **Decorative glow orbs:** large blurred circles with subtle parallax

### Tailwind Config Mapping

Map design tokens to Tailwind via `tailwind.config.ts`:
```
colors: bg, bg-card, bg-card-hover, accent-purple, accent-blue, accent-green, accent-cyan
textColor: primary, secondary, muted
borderColor: subtle, card, hover
fontFamily: sans → Plus Jakarta Sans, mono → JetBrains Mono
```

Use CSS variables for values that need runtime access (gradients, rgba borders, easing).

### Spacing & Layout

- Max content width: 1100px (most sections), 1280px (hero)
- Section padding: 140px vertical, 24px horizontal
- Card padding: 36–44px (large), 28–32px (small)
- Card border-radius: 20–24px (large), 12–14px (small/buttons)
- Grid gaps: 16–18px between cards

---

## Developer Preferences

### Code Style
- TypeScript strict mode — no `any` types
- React 19 with function components only
- Named exports for components, default exports for pages
- Co-locate component files: `component-name.tsx` in the appropriate directory
- Small components — if a component exceeds 150 lines, split it
- API calls live in `hooks/` directory using TanStack Query, not in components
- Server state: TanStack Query. Client state: Zustand (only for truly global UI state like sidebar open/closed)
- Forms: React Hook Form + Zod for validation

### Naming Conventions
- Files: `kebab-case.tsx` (e.g. `job-card.tsx`, `use-profile.ts`)
- Components: `PascalCase` (e.g. `JobCard`, `ProfileEditor`)
- Hooks: `camelCase` with `use` prefix (e.g. `useProfile`, `useJobs`)
- Types/Interfaces: `PascalCase` with no `I` prefix (e.g. `Job`, not `IJob`)
- Constants: `UPPER_SNAKE_CASE`
- CSS variables: `kebab-case` (e.g. `--color-accent-purple`)
- Routes: `kebab-case` matching URL paths

### Dos
- Always read `docs/frontend-todo.md` before starting work on a phase
- Use shadcn/ui components as base — customize via Tailwind classes, not CSS overrides
- Use TanStack Query for all API calls — never fetch in `useEffect`
- Type all API responses — create types in `src/types/` mirroring backend Pydantic schemas
- Use the `cn()` utility (clsx + tailwind-merge) for conditional classes
- Lazy-load route components for code splitting
- Use React Hook Form + Zod for complex forms
- Write loading skeletons and error states for every data-fetching component
- Test in mobile viewport — every page must be responsive
- Use path aliases (`@/`) for imports — never `../../..`

### Don'ts
- Don't use CSS modules, styled-components, or emotion — Tailwind only
- Don't fetch data inside components — use hooks with TanStack Query
- Don't store server state in Zustand — that's what TanStack Query is for
- Don't use inline `style={}` except for dynamic values that Tailwind cannot handle
- Don't hardcode API URLs — use `VITE_API_URL` environment variable
- Don't store tokens in localStorage — use Supabase client's built-in session management
- Don't add comments that restate what the code does
- Don't create abstractions for one-time use — keep it simple

### Security Rules
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- Use `VITE_SUPABASE_ANON_KEY` only (safe for browser, respects RLS)
- All API calls to backend send `Authorization: Bearer <token>` from Supabase session
- Sanitize any user content rendered as HTML
- Never store sensitive data in localStorage

---

## Branch Strategy

### Frontend Phase Branches
Each frontend phase gets its own branch cut from `dev`:

```
dev
 └── phase/F1-scaffold
 └── phase/F2-auth
 └── phase/F3-layout
 └── phase/F4-dashboard
 └── phase/F5-profile
 └── phase/F6-jobs
 └── phase/F7-auto-apply
 └── phase/F8-applications
 └── phase/F9-landing
```

Branch naming: `phase/FN-short-name` (F prefix distinguishes from backend phases).

### Commit Message Format
```
phase(FN): checkpoint description

- bullet summarizing key changes
- bullet summarizing key changes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

All other branching conventions (merge strategy, WIP commits, staging rules, guardrails) follow the same rules as the backend skill (`.claude/skills/auto-apply-dev.md`).

---

## Phase Workflow

### Starting a Phase

1. **Read** `docs/frontend-todo.md` — identify current phase and unchecked items
2. **Read** `IMPLEMENTATION_STATUS.md` — understand what's already built
3. **Read** `CLAUDE.md` — check for updated instructions
4. **Branch** — create `phase/FN-short-name` from `dev`
5. **Implement** tasks in order within the phase, committing at each checkpoint
6. **Update** `docs/frontend-todo.md` — mark tasks `[x]` as they complete
7. **Update** `IMPLEMENTATION_STATUS.md` — record what was built
8. **Merge** — merge phase branch to `dev` when all tasks done

### After Each Chat / Phase — Required Updates

1. **Commit** any uncommitted changes (WIP commit if mid-phase)
2. **Update** `docs/frontend-todo.md` — mark completed `[x]`, in-progress `[~]`
3. **Update** `IMPLEMENTATION_STATUS.md` — record files created, decisions made
4. **Update** `memory/MEMORY.md` if new patterns or decisions were discovered

---

## Common Commands

```bash
# Install dependencies
cd frontend && pnpm install

# Start dev server
cd frontend && pnpm dev

# Build for production
cd frontend && pnpm build

# Preview production build
cd frontend && pnpm preview

# Type check
cd frontend && pnpm typecheck

# Lint
cd frontend && pnpm lint

# Format
cd frontend && pnpm format

# Add shadcn component
cd frontend && pnpm dlx shadcn@latest add button
```

---

## Key File Locations

| Purpose | Path |
|---------|------|
| Entry point | `frontend/src/main.tsx` |
| Root layout | `frontend/src/app.tsx` |
| Router config | `frontend/src/router.tsx` |
| Pages | `frontend/src/pages/` |
| Shared components | `frontend/src/components/` |
| UI primitives (shadcn) | `frontend/src/components/ui/` |
| Landing page components | `frontend/src/components/landing/` |
| Layout components | `frontend/src/components/layout/` |
| API hooks | `frontend/src/hooks/` |
| API client | `frontend/src/lib/api.ts` |
| Supabase client | `frontend/src/lib/supabase.ts` |
| Utility helpers | `frontend/src/lib/utils.ts` |
| TypeScript types | `frontend/src/types/` |
| Global stores (Zustand) | `frontend/src/stores/` |
| Static assets | `frontend/src/assets/` |
| Tailwind config | `frontend/tailwind.config.ts` |
| Vite config | `frontend/vite.config.ts` |
| Env vars | `frontend/.env.local` |
| Design spec | `frontend/design.txt` |
| Frontend todo | `docs/frontend-todo.md` |

---

## API Integration

### Backend URL
`http://localhost:8000` in development. Set via `VITE_API_URL` env var.

### Auth Pattern
1. Supabase JS client handles auth flows (signup, login, OAuth)
2. Supabase client provides JWT via `session.access_token`
3. All API calls to backend send `Authorization: Bearer <token>` header
4. Use `supabase.auth.onAuthStateChange()` to react to session changes
5. On 401 response, trigger token refresh or redirect to login

### Available Backend Endpoints

**Auth (Phase 4):**
- `POST /api/auth/signup` — body: `{email, password}` → `UserResponse`
- `POST /api/auth/login` — body: `{email, password}` → `TokenResponse`
- `POST /api/auth/oauth/google` → `{url}` (redirect URL)
- `GET /api/auth/oauth/callback?code=` → redirect with token
- `POST /api/auth/logout` → 204
- `GET /api/auth/me` → `UserResponse`

**Profile (Phase 5):**
- `GET /api/profile` → `ProfileResponse` (auto-creates)
- `PUT /api/profile` — body: `ProfileUpdate` → `ProfileResponse`
- `PUT /api/profile/experiences` — body: `ExperienceCreate[]` → `ExperienceResponse[]`
- `PUT /api/profile/education` — body: `EducationCreate[]` → `EducationResponse[]`
- `PUT /api/profile/skills` — body: `SkillCreate[]` → `SkillResponse[]`
- `GET /api/profile/preferences` → `ApplicationPreferences | null`
- `PUT /api/profile/preferences` — body: `ApplicationPreferencesUpdate` → `ApplicationPreferences`
- `POST /api/profile/resume/upload` — multipart/form-data (PDF, max 10MB) → `ProfileResponse`
- `POST /api/profile/resume/parse` → `ParsedResume`
- `GET /api/profile/resume/parsed` → `ParsedResume`

**Jobs (Phase 6):**
- `GET /api/jobs?query=&location=&location_type=&salary_min=&category=&page=&per_page=&sort_by=` → `JobListResponse`
- `GET /api/jobs/{id}` → `JobResponse` (includes match_score)
- `GET /api/jobs/{id}/match` → `{job_id, score, factors, computed_at}`

**Auto-Apply (Phase 7):**
- `GET /api/auto-apply/config` → `AutoApplyConfigResponse` (auto-creates)
- `PUT /api/auto-apply/config` — body: `AutoApplyConfigUpdate` → `AutoApplyConfigResponse`
- `POST /api/auto-apply/start` → `{status, is_active, ...match_stats}`
- `POST /api/auto-apply/stop` → `{status, is_active, applications_skipped}`
- `GET /api/auto-apply/queue` → `QueueStatus`
- `POST /api/auto-apply/review/{id}?action=approve|reject` → `{application_id, status}`

**Applications (Phase 8):**
- `GET /api/applications?status=&date_from=&date_to=&page=&per_page=` → `ApplicationListResponse`
- `GET /api/applications/{id}` → `ApplicationDetail`
- `GET /api/applications/stats` → `ApplicationStats`

### NOT Available Yet (Don't Build UI For)
- Document generation (backend Phase 9 — not started)
- Billing / Stripe checkout (backend Phase 10 — not started)
- Pricing page CTA buttons should link to `/signup`, not to Stripe

---

## Architecture Decisions (Locked)

1. **React 19 + Vite** — pure SPA, no SSR needed (backend is FastAPI)
2. **TanStack Router** — type-safe client-side routing
3. **TanStack Query** — server state management (caching, background refetch, mutations)
4. **Zustand** — minimal global client state only (sidebar, theme)
5. **Tailwind CSS + shadcn/ui** — design system maps to Tailwind config, shadcn gives accessible primitives
6. **React Hook Form + Zod** — form validation
7. **fetch wrapper (not Axios)** — lightweight, all JSON, wrapper attaches JWT
8. **Supabase JS client** — handles auth token storage, refresh, OAuth flows
9. **pnpm** — package manager (fast, strict dependency management)

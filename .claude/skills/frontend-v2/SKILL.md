---
name: frontend-v2
description: Frontend V2 rebuild context, conventions, and phase execution guide. Use when working on any frontend-v2 task, starting a new phase, or continuing an in-progress phase.
disable-model-invocation: false
---

# Frontend V2 Rebuild Guide

You are rebuilding the ApplyPilot frontend from scratch in `frontend/src-v2/`. This is a complete rewrite with a new design system (Deep Ocean), new component library, and aviation-inspired UI.

---

## Quick Context

- **Source directory:** `frontend/src-v2/` (NOT `src/`)
- **Design system:** Deep Ocean — dual-theme (dark default, light variant), sidebar always dark
- **Primary font:** JetBrains Mono (monospace) — dominant for labels, headers, data, badges
- **Secondary font:** Inter (sans) — body text, job titles, form input values
- **Primary color:** Teal Aqua `#2ec4b6` (brand, CTAs, active states)
- **Prototype reference:** `docs/applypilot-v41.jsx`
- **Design docs:** `docs/01-DESIGN_SYSTEM.md` through `docs/07-IMPLEMENTATION_ORDER.md`
- **API reference:** `docs/BACKEND_API_REFERENCE.md`
- **Plans:** `.claude/plans/frontend-v2/` (12 phase files + progress.md)
- **Progress tracker:** `.claude/plans/frontend-v2/progress.md` — UPDATE THIS after completing any step

## Before Starting a Phase

1. Read the phase plan file: `.claude/plans/frontend-v2/phase-XX-*.md`
2. Check `progress.md` for current status and any notes from previous sessions
3. Read `/develop` skill for branch workflow and coding conventions
4. If the phase references specific design docs, read those too
5. Check existing `src-v2/` files to understand what's already built

## Tech Stack (Already Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2.0 | UI library |
| TanStack Router | 1.121.4 | Client-side routing |
| TanStack Query | 5.80.7 | Server state management |
| React Hook Form | 7.56.4 | Form state + validation |
| Zod | 3.25.42 | Schema validation |
| Zustand | 5.0.6 | Client state (UI only) |
| Supabase JS | 2.49.8 | Auth + DB client |
| shadcn/ui | (cli) | Unstyled component base |
| Radix UI | 1.4.3 | Component primitives |
| Tailwind CSS | 4.1.10 | Utility-first CSS (v4, inline config) |
| Lucide React | 0.513.0 | Icons (supplement to custom icon set) |
| Motion | 12.35.0 | Animations |

## Coding Conventions for Frontend V2

### File Structure
```
src-v2/
├── main.tsx, app.tsx, router.tsx, index.css, vite-env.d.ts
├── theme/          — tokens, context, utils
├── icons/          — 19 custom SVG icon components
├── components/
│   ├── ui/         — Core primitives (Led, Badge, Card, Button, etc.)
│   ├── layout/     — Shell (Sidebar, StatusBar, Header, DashboardLayout)
│   ├── shared/     — Composite (JRow, SidePanel, MatchDot, Pagination)
│   └── [feature]/  — Page-specific (dashboard/, jobs/, queue/, etc.)
├── pages/          — Route page components
├── hooks/          — TanStack Query hooks + custom hooks
├── lib/            — api.ts, supabase.ts, utils.ts, constants.ts
├── stores/         — Zustand stores (auth, ui, toast)
└── types/          — TypeScript interfaces
```

### Naming
- Files: `kebab-case.tsx` (e.g., `job-card.tsx`, `use-profile.ts`)
- Components: `PascalCase` (named exports)
- Pages: `PascalCase` (default exports)
- Hooks: `camelCase` with `use` prefix
- Types: `PascalCase`, no `I` prefix
- CSS classes: Tailwind utilities, use `cn()` for conditionals

### Key Rules
- TypeScript strict — no `any`
- Components under 150 lines — split if larger
- API calls in hooks via TanStack Query, never in components directly
- Server state: TanStack Query. Client state: Zustand (UI only, never server data)
- Forms: React Hook Form + Zod
- Path aliases: `@/` → `src-v2/` (never `../../..`)
- Theme: use CSS custom properties from Tailwind config + theme context for dynamic values
- No inline `style={}` unless Tailwind can't handle it (dynamic colors from theme)
- No emojis in the UI

### Design System Quick Reference

**Semantic Colors:**
- `pri` (#2ec4b6) — teal, primary/active/brand
- `ok` (#64b5cf) — ice blue, success/applied
- `warn` (#e0a850) — amber, warning/review
- `fail` (#d06060) — red, error/failed
- `muted` (#4a6070) — neutral, disabled/skipped

**Status Mapping:**
- queued → pri (QUEUED)
- in_progress → pri (IN-FLIGHT)
- pending_review → warn (REVIEW)
- applied → ok (LANDED)
- failed → fail (FAILED)
- skipped → muted (SKIPPED)

**Match Tiers:**
- 90+ → Exceptional (pri)
- 75+ → Strong (ok)
- 60+ → Good (warn)
- 45+ → Moderate (muted)
- 30+ → Weak (muted)
- <30 → Poor (muted)

**Typography:** Labels/headers/data = JetBrains Mono (uppercase, letter-spacing). Body/titles = Inter.

**Layout:** Sidebar 240px fixed | Main content (StatusBar 36px + Header ~56px + Content 20px 28px padding)

## After Completing a Step

1. Update `progress.md`:
   - Mark the phase status (IN PROGRESS / COMPLETE)
   - Add the step to the "Completed Steps Log" with date
   - Note any issues or decisions made
2. Run `pnpm typecheck` to verify no type errors
3. Run `pnpm dev` to verify the app loads correctly
4. If this was the last step in a phase, update the phase status to COMPLETE

## Phase Dependency Quick Reference

```
Phase 0 (Foundation) ← Must complete first
  ├── Phase 1 (Shell) ← needed for page rendering
  ├── Phase 2 (Components) ← needed for page content
  └── Phase BE (Backend) ← can run anytime in parallel

Phases 3-9 (Pages) ← need Phases 1+2, independent of each other
Phase 10 (Polish) ← needs all pages complete
```

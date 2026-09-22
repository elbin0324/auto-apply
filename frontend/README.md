# AutoApply — Frontend

The React single-page app for [AutoApply](../README.md). See the root README for the full
architecture; this file covers the client only.

## Stack

React 19 · Vite 7 · TypeScript 5.9 (strict) · Tailwind CSS 4 · shadcn/ui on Radix ·
TanStack Router · TanStack Query · Zustand · React Hook Form + Zod · Motion

## Layout

```
src-v2/
  main.tsx        Entry point
  app.tsx         Providers (Query client, router, auth bootstrap)
  router.tsx      Route tree — pages wrapped in ProtectedRoute + DashboardLayout,
                  admin routes behind AdminRoute
  pages/          Route-level pages (landing, dashboard, jobs, queue, tracker,
                  autopilot, profile, analytics, billing, settings, onboarding,
                  login, signup)
  components/
    ui/           shadcn/ui primitives
    landing/      Marketing site sections
    <domain>/     Feature components grouped by page domain
  hooks/          TanStack Query hooks (use-jobs, use-profile, ...)
  stores/         Zustand auth store
  lib/            api.ts (fetch client, auto-attaches Supabase JWT),
                  supabase.ts, shared constants and helpers
  theme/          Design tokens
  icons/          Icon components
```

The Vite alias `@` resolves to `src-v2/`.

> `src-v1-deprecated/` was the first iteration of this client. It is retained in git history and
> is not part of the build.

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev                     # http://localhost:5173
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the FastAPI backend (e.g. `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (publishable) key |

Only `VITE_`-prefixed variables reach the browser bundle. Never put a service-role key here.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | `tsc -b` then production build |
| `pnpm preview` | Serve the production build locally |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

From the repo root, `make fe-dev`, `make lint`, `make format`, and `make typecheck` wrap these.

## Data fetching

Components never call `fetch` directly. Every server interaction goes through a hook in `hooks/`
built on TanStack Query, which calls the client in `lib/api.ts`. That client reads the current
Supabase session and attaches the JWT as a bearer token on every request, so auth is not a
per-call concern.

## Deployment

Deployed to Vercel. `vercel.json` rewrites all paths to `/index.html` so client-side routing works
on hard navigation.

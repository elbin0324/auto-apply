# Dashboard Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate 8 dashboard pages into 4 pages (Jobs, Applications, Autopilot, Profile with tabs) so each page has a single clear purpose.

**Architecture:** Update the TanStack Router config to define 4 protected routes (plus profile sub-routes). Update the sidebar nav constants to match. Rewrite the Profile page as a tabbed layout with 4 tabs using sub-routes. Replace the Applications page with a simplified read-only version based on the Tracker pattern. No components are deleted — unused ones simply stop being rendered.

**Tech Stack:** React 19, TanStack Router, TypeScript, Tailwind CSS 4, shadcn/ui patterns, TanStack Query hooks

**Spec:** `docs/superpowers/specs/2026-03-31-dashboard-page-redesign.md`

---

### Task 1: Update constants — nav items, sections, page titles

**Files:**
- Modify: `frontend/src-v2/lib/constants.ts`

This task updates the sidebar navigation structure and page header titles to reflect the new 4-page layout.

- [ ] **Step 1: Update NAV_SECTIONS, NAV_ITEMS, and PAGE_TITLES**

Replace the full contents of `frontend/src-v2/lib/constants.ts` with:

```typescript
export const APP_NAME = "ApplyPilot";
export const APP_VERSION = "2.0.0";

export type NavSection = "MAIN" | "ACCOUNT";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  section: NavSection;
  hasBadge?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "jobs", label: "Jobs", path: "/", icon: "Target", section: "MAIN", hasBadge: true },
  { id: "applications", label: "Applications", path: "/applications", icon: "Radar", section: "MAIN", hasBadge: true },
  { id: "autopilot", label: "Autopilot", path: "/autopilot", icon: "Bot", section: "MAIN" },
  { id: "profile", label: "Profile", path: "/profile", icon: "Doc", section: "ACCOUNT" },
];

export const PAGE_TITLES: Record<string, string> = {
  "/": "JOBS",
  "/applications": "APPLICATIONS",
  "/autopilot": "AUTOPILOT",
  "/profile": "PROFILE",
  "/profile/resume": "PROFILE",
  "/profile/preferences": "PROFILE",
  "/profile/applications": "PROFILE",
  "/profile/account": "PROFILE",
};

export const NAV_SECTIONS: NavSection[] = ["MAIN", "ACCOUNT"];

export const STATUS_LABELS: Record<string, string> = {
  queued: "QUEUED",
  in_progress: "IN-FLIGHT",
  pending_review: "REVIEW",
  applied: "LANDED",
  failed: "FAILED",
  skipped: "SKIPPED",
};

export const STATUS_COLORS: Record<string, string> = {
  queued: "pri",
  in_progress: "pri",
  pending_review: "warn",
  applied: "ok",
  failed: "fail",
  skipped: "muted",
};
```

- [ ] **Step 2: Verify the frontend compiles**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -20`

Expected: Build may have warnings about removed routes (dashboard, queue, etc.) but constants file itself should compile cleanly. Errors are expected at this stage because the router still references old pages — that's fixed in Task 2.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/lib/constants.ts
git commit -m "refactor: update nav constants for 4-page layout"
```

---

### Task 2: Rewrite router — 4 main routes + profile sub-routes

**Files:**
- Modify: `frontend/src-v2/router.tsx`

Replace all 8 protected routes with 4 routes. The index route (`/`) now renders Jobs for authenticated users and Landing for unauthenticated. Profile gets sub-routes for its 4 tabs.

- [ ] **Step 1: Rewrite router.tsx**

Replace the full contents of `frontend/src-v2/router.tsx` with:

```typescript
import { lazy, Suspense } from "react";
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AuthOnlyRoute } from "@/components/layout/auth-only-route";

const LoginPage = lazy(() => import("@/pages/login"));
const SignupPage = lazy(() => import("@/pages/signup"));
const JobsPage = lazy(() => import("@/pages/jobs"));
const ApplicationsPage = lazy(() => import("@/pages/applications"));
const AutopilotPage = lazy(() => import("@/pages/autopilot"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const LandingPage = lazy(() => import("@/pages/landing"));
const KitchenSinkPage = lazy(() => import("@/pages/kitchen-sink"));

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-pri border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const rootRoute = createRootRoute({
  component: Outlet,
});

// Helper for public route guards
function redirectIfAuthenticated() {
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) {
    throw redirect({ to: "/" });
  }
}

// Helper for protected route guards
function requireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore.getState();
  if (!isLoading && !isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <PageSuspense><LoginPage /></PageSuspense>,
  beforeLoad: redirectIfAuthenticated,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: () => <PageSuspense><SignupPage /></PageSuspense>,
  beforeLoad: redirectIfAuthenticated,
});

// Onboarding (auth required, no dashboard layout)
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <AuthOnlyRoute>
      <PageSuspense><OnboardingPage /></PageSuspense>
    </AuthOnlyRoute>
  ),
  beforeLoad: requireAuth,
});

// Protected routes (auth + dashboard layout)
function protectedPage(Page: React.LazyExoticComponent<() => React.JSX.Element>) {
  return () => (
    <ProtectedRoute>
      <PageSuspense><Page /></PageSuspense>
    </ProtectedRoute>
  );
}

// Index route: Landing for unauthenticated, Jobs for authenticated
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) {
      return <PageSuspense><LandingPage /></PageSuspense>;
    }
    return (
      <ProtectedRoute>
        <PageSuspense><JobsPage /></PageSuspense>
      </ProtectedRoute>
    );
  },
});

const applicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications",
  component: protectedPage(ApplicationsPage),
  beforeLoad: requireAuth,
});

const autopilotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/autopilot",
  component: protectedPage(AutopilotPage),
  beforeLoad: requireAuth,
});

// Profile routes — parent + tab sub-routes
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const profileResumeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/resume",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const profilePreferencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/preferences",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const profileApplicationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/applications",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

const profileAccountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/account",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});

// Kitchen sink (dev only, no auth)
const kitchenSinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kitchen-sink",
  component: () => <PageSuspense><KitchenSinkPage /></PageSuspense>,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  onboardingRoute,
  applicationsRoute,
  autopilotRoute,
  profileRoute,
  profileResumeRoute,
  profilePreferencesRoute,
  profileApplicationsRoute,
  profileAccountRoute,
  kitchenSinkRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

- [ ] **Step 2: Verify the build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -20`

Expected: May fail because `@/pages/applications` doesn't exist yet. That's OK — created in Task 3.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/router.tsx
git commit -m "refactor: rewrite router for 4-page layout with profile sub-routes"
```

---

### Task 3: Create Applications page

**Files:**
- Create: `frontend/src-v2/pages/applications.tsx`

This is a simplified read-only page that merges Tracker stats + ApplicationTable + status filter + SidePanel. It reuses existing components — no new components needed.

- [ ] **Step 1: Create the Applications page**

Create `frontend/src-v2/pages/applications.tsx`:

```typescript
import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/shared/side-panel";
import { Pagination } from "@/components/shared/pagination";
import { TrackerStats } from "@/components/tracker/tracker-stats";
import { ApplicationTable } from "@/components/tracker/application-table";
import { useApplications, useApplicationStats } from "@/hooks/use-applications";
import type { Application } from "@/types/application";
import type { Job } from "@/types/job";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "in_progress", label: "In-Flight" },
  { value: "applied", label: "Applied" },
  { value: "failed", label: "Failed" },
] as const;

export default function ApplicationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { data: stats, isLoading: statsLoading } = useApplicationStats();
  const { data: appData, isLoading: appsLoading } = useApplications({
    status: statusFilter || undefined,
    page,
    per_page: 20,
  });

  const applications = appData?.applications ?? [];
  const totalPages = appData?.pages ?? 1;

  const handleRowClick = useCallback((application: Application) => {
    setSelectedApp(application);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const panelJob: Job | null = selectedApp?.job ?? null;

  return (
    <>
      <div className="space-y-3.5">
        {/* Stats Row */}
        <TrackerStats stats={stats} isLoading={statsLoading} />

        {/* Status Filter */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "ghost"}
              onClick={() => handleStatusChange(f.value)}
              className="px-3 py-1.5 text-[10px]"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Application Table */}
        <Card>
          <ApplicationTable
            applications={applications}
            onRowClick={handleRowClick}
            loading={appsLoading}
          />
        </Card>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Side Panel for application detail — read-only, no approve/reject */}
      <SidePanel
        job={panelJob}
        application={selectedApp}
        isOpen={selectedApp !== null}
        onClose={handleClosePanel}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -20`

Expected: Should compile. The `useApplications` hook already supports an optional `status` filter param. The `TrackerStats`, `ApplicationTable`, `Pagination`, and `SidePanel` components are all existing.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/pages/applications.tsx
git commit -m "feat: add consolidated Applications page with stats and status filter"
```

---

### Task 4: Rewrite Profile page with tabbed layout

**Files:**
- Modify: `frontend/src-v2/pages/profile.tsx`

The Profile page becomes a tabbed view that reads the current URL path to determine which tab is active. Each tab renders existing components. Two tabs (Job Preferences and Application Preferences) are new — they render placeholder cards for now since the backend doesn't have endpoints for them yet.

- [ ] **Step 1: Rewrite profile.tsx with tab navigation**

Replace the full contents of `frontend/src-v2/pages/profile.tsx` with:

```typescript
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Tab content components
import { ContactCard } from "@/components/profile/contact-card";
import { ResumeCard } from "@/components/profile/resume-card";
import { ExperienceEditor } from "@/components/profile/experience-editor";
import { SkillsEditor } from "@/components/profile/skills-editor";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { AccountCard } from "@/components/settings/account-card";

const TABS = [
  { id: "resume", label: "Resume & Experience", path: "/profile/resume" },
  { id: "preferences", label: "Job Preferences", path: "/profile/preferences" },
  { id: "applications", label: "Application Preferences", path: "/profile/applications" },
  { id: "account", label: "Account", path: "/profile/account" },
] as const;

function activeTabFromPath(pathname: string): string {
  const tab = TABS.find((t) => t.path === pathname);
  return tab?.id ?? "resume";
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const activeTab = activeTabFromPath(routerState.location.pathname);

  const { data: profile, isLoading, isError } = useProfile();

  const handleTabClick = (path: string) => {
    navigate({ to: path });
  };

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <div className="flex gap-1.5 border-b border-border-main pb-3">
          {TABS.map((t) => (
            <div key={t.id} className="h-8 w-32 animate-pulse rounded bg-bg-muted" />
          ))}
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-[13px] text-t-400">
          Unable to load profile. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--tw-10)" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={cn(
                "cursor-pointer px-4 py-2.5 font-mono text-[11px] font-medium transition-colors",
                "border-b-2 -mb-px",
                isActive
                  ? "border-pri text-pri"
                  : "border-transparent text-t-400 hover:text-t-600",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "resume" && (
        <div className="space-y-3.5">
          <div className="grid gap-3.5 md:grid-cols-2">
            <ResumeCard profile={profile} />
          </div>
          <ExperienceEditor experiences={profile.experiences} profileId={profile.id} />
          <SkillsEditor skills={profile.skills} />
        </div>
      )}

      {activeTab === "preferences" && (
        <Card>
          <div className="p-6">
            <h3 className="mb-2 font-mono text-[13px] font-semibold text-t-700">
              Job Preferences
            </h3>
            <p className="font-mono text-[11px] text-t-400">
              Configure your desired job titles, locations, salary range, and work type.
              Coming soon.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "applications" && (
        <Card>
          <div className="p-6">
            <h3 className="mb-2 font-mono text-[13px] font-semibold text-t-700">
              Application Preferences
            </h3>
            <p className="font-mono text-[11px] text-t-400">
              Set default answers for common application questions like work authorization,
              start date, and relocation preferences. Coming soon.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "account" && (
        <div className="space-y-3.5">
          <ContactCard profile={profile} />
          <div className="grid gap-3.5 md:grid-cols-2">
            <SubscriptionCard />
            <AccountCard />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -20`

Expected: Clean build. All imported components already exist.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/pages/profile.tsx
git commit -m "feat: rewrite Profile page with 4 tabbed sections"
```

---

### Task 5: Update sidebar active state for index route and profile sub-routes

**Files:**
- Modify: `frontend/src-v2/components/layout/sidebar.tsx`

The sidebar currently does exact-match `currentPath === item.path` for active state. This needs to handle two cases:
1. Jobs nav item (`/`) should be active on the index route
2. Profile nav item (`/profile`) should be active on all `/profile/*` sub-routes

- [ ] **Step 1: Update the active-state logic in sidebar.tsx**

In `frontend/src-v2/components/layout/sidebar.tsx`, find:

```typescript
              const isActive = currentPath === item.path;
```

Replace with:

```typescript
              const isActive =
                item.path === "/"
                  ? currentPath === "/"
                  : currentPath === item.path || currentPath.startsWith(item.path + "/");
```

This makes:
- `/` active only on exact match (so it's not active on `/applications`)
- `/profile` active on `/profile`, `/profile/resume`, `/profile/preferences`, etc.
- `/applications` and `/autopilot` still use exact match (they have no sub-routes)

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -20`

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/components/layout/sidebar.tsx
git commit -m "fix: sidebar active state for index route and profile sub-routes"
```

---

### Task 6: Handle redirects for old routes

**Files:**
- Modify: `frontend/src-v2/router.tsx`

Users or bookmarks may still reference `/dashboard`, `/jobs`, `/queue`, `/tracker`, `/analytics`, `/settings`. Add redirect routes so they land on the right page.

- [ ] **Step 1: Add redirect routes to router.tsx**

In `frontend/src-v2/router.tsx`, add these route definitions after the `kitchenSinkRoute` definition and before the `routeTree` construction:

```typescript
// Legacy redirects — old routes point to new locations
const dashboardRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => { throw redirect({ to: "/" }); },
});

const jobsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs",
  beforeLoad: () => { throw redirect({ to: "/" }); },
});

const queueRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/queue",
  beforeLoad: () => { throw redirect({ to: "/applications" }); },
});

const trackerRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tracker",
  beforeLoad: () => { throw redirect({ to: "/applications" }); },
});

const analyticsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  beforeLoad: () => { throw redirect({ to: "/applications" }); },
});

const settingsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  beforeLoad: () => { throw redirect({ to: "/profile/account" }); },
});
```

Then update the `routeTree` to include them:

```typescript
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  onboardingRoute,
  applicationsRoute,
  autopilotRoute,
  profileRoute,
  profileResumeRoute,
  profilePreferencesRoute,
  profileApplicationsRoute,
  profileAccountRoute,
  kitchenSinkRoute,
  // Legacy redirects
  dashboardRedirect,
  jobsRedirect,
  queueRedirect,
  trackerRedirect,
  analyticsRedirect,
  settingsRedirect,
]);
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -20`

Expected: Clean build. Redirects don't need component definitions.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/router.tsx
git commit -m "feat: add legacy route redirects for old page URLs"
```

---

### Task 7: Update profile default route to redirect to /profile/resume

**Files:**
- Modify: `frontend/src-v2/router.tsx`

When a user navigates to `/profile` (no sub-path), it should redirect to `/profile/resume` so they always land on a tab.

- [ ] **Step 1: Add redirect to the profile route**

In `frontend/src-v2/router.tsx`, find the `profileRoute` definition:

```typescript
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: protectedPage(ProfilePage),
  beforeLoad: requireAuth,
});
```

Replace with:

```typescript
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: () => {
    requireAuth();
    throw redirect({ to: "/profile/resume" });
  },
});
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -20`

Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add frontend/src-v2/router.tsx
git commit -m "fix: redirect /profile to /profile/resume"
```

---

### Task 8: Final verification — full build + manual smoke test

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm build 2>&1 | tail -30`

Expected: Clean build with no errors. There may be unused import warnings for old page files (dashboard.tsx, queue.tsx, etc.) — that's fine, they're not imported anywhere.

- [ ] **Step 2: Run TypeScript check**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm typecheck 2>&1 | tail -20`

Expected: No type errors.

- [ ] **Step 3: Run lint**

Run: `cd /Users/andycraig/GitHub/applypilot/auto-apply/frontend && pnpm lint 2>&1 | tail -20`

Expected: Clean or only pre-existing warnings. Fix any new lint errors introduced by the changes.

- [ ] **Step 4: Verify route table**

Confirm these routes work by checking the built output:
- `/` → Jobs page (authenticated) or Landing (unauthenticated)
- `/applications` → Applications page with stats + table
- `/autopilot` → Autopilot page (unchanged)
- `/profile/resume` → Profile with Resume & Experience tab active
- `/profile/preferences` → Profile with Job Preferences tab active
- `/profile/applications` → Profile with Application Preferences tab active
- `/profile/account` → Profile with Account tab active
- `/dashboard` → redirects to `/`
- `/jobs` → redirects to `/`
- `/queue` → redirects to `/applications`
- `/tracker` → redirects to `/applications`
- `/settings` → redirects to `/profile/account`

- [ ] **Step 5: Commit any fixes**

If any build/lint/type fixes were needed, commit them:

```bash
git add -u
git commit -m "fix: resolve build/lint issues from page redesign"
```

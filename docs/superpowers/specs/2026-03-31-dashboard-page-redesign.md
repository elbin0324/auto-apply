# Dashboard Page Redesign — Spec

**Date:** 2026-03-31
**Goal:** Reduce page count from 8 to 4, giving each page a single clear purpose so users always know where to go.

---

## Problem

The current 8-page dashboard has overlapping responsibilities:
- Dashboard, Analytics, Tracker, and Queue all show application-related stats or lists
- Users can't tell where to go to answer "how are my applications doing?"
- Dashboard and Analytics are mostly placeholder/fake data
- Profile and Settings are thin pages that don't cover the full surface area of user configuration

## Design Principles

- Each page answers one question: "What do I do here?"
- Primary user workflow: browse matched jobs, click apply, occasionally check results
- Jobs page is home — it's the most actionable page
- No components are deleted — unused components stay in the codebase for future use

---

## Final Page Structure (4 Pages)

### 1. Jobs (Home) — `/`

**Purpose:** Find and apply to matched jobs.

**Sections:**
1. **Filter bar** — Search input (300ms debounce), location type dropdown, experience level dropdown, sort by dropdown
2. **Job list** — Animated job cards with exit animation on apply
3. **Pagination** — Prev/Next at bottom
4. **Side panel** — Job detail + match breakdown + "Apply" button

**Data:** `useJobs(filters)`, `useJobDetail(id)` (lazy)

**Changes from current:** Route moves from `/jobs` to `/`. No functional changes.

---

### 2. Applications — `/applications`

**Purpose:** See the status and history of all your applications.

Consolidates current Queue (read-only parts), Tracker, and Analytics stats into one page.

**Sections:**
1. **Stats summary bar** — 4-5 cards in a row:
   - Total Applications
   - Landed/Success
   - In Progress (queued + in-flight)
   - Failed
   - Success Rate %
2. **Status filter** — Lightweight filter (All, Queued, In-Flight, Applied, Failed) via tabs or dropdown. Not the heavy 5-tab system from current Queue.
3. **Application table** — Reuses `ApplicationTable` component:
   - Columns: Company (logo), Position, ATS, Match Score, Status (badge), Date
   - Clickable rows open side panel
   - Pagination
4. **Side panel** — Application detail + job info (read-only, no approve/reject)

**Data:** `useApplicationStats()`, `useApplications({ status, page })`

**What's NOT included (V1):**
- Batch select/approve/reject workflow
- ReviewList, BatchBar, AnswerPreviewOverlay components
- SSE real-time updates
- InFlightMonitor as standalone section

These components remain in the codebase and can be reintroduced when the review workflow is built.

---

### 3. Autopilot — `/autopilot`

**Purpose:** Configure and control automatic job applications.

**Sections:**
1. **Engage card** — On/off toggle with plane icon, status text, footer stats (queue depth, today's applied vs limit)
2. **Targeting card** — Tag inputs for job titles, locations, excluded companies
3. **Mode card** — Safe/Hybrid/Full Auto buttons, threshold slider (Hybrid mode), daily limit slider

**Data:** `useAutoApplyConfig()`, `useQueueStatus()`, `useApplicationStats()`

**Changes from current:** None. This page is already well-scoped.

---

### 4. Profile — `/profile` (Tabbed)

**Purpose:** Manage everything about you and your account.

Consolidates current Profile and Settings pages into a single tabbed page with 4 tabs.

#### Tab: Resume & Experience (`/profile/resume`)
- Resume upload/viewer
- Work experience editor (add/edit/delete entries)
- Education section
- Skills editor (tag-based)

**Reuses:** `ResumeCard`, `ExperienceEditor`, `SkillsEditor` from current Profile page.

#### Tab: Job Preferences (`/profile/preferences`)
- Desired job titles
- Desired locations
- Salary range expectations
- Work type preference (remote/hybrid/onsite)
- Experience level

**Note:** Some of this overlaps with Autopilot targeting. Job Preferences is about the user's general profile ("what I want"), while Autopilot targeting is about the current automation run ("what to search for right now"). They may share defaults but serve different purposes.

#### Tab: Application Preferences (`/profile/applications`)
- Default answers to common application questions (work authorization, start date, willing to relocate, etc.)
- Cover letter preferences/template
- Reusable Q&A for application forms

**Note:** This tab may be partially or fully new — content depends on what application fields the agent needs defaults for.

#### Tab: Account (`/profile/account`)
- Email and contact info (from current `ContactCard`)
- Password management
- Subscription/billing info (from current `SubscriptionCard`)
- Danger zone (delete account)
- Logout

**Reuses:** `ContactCard`, `SubscriptionCard`, `AccountCard` from current Profile and Settings pages.

**Tab navigation:** Horizontal tabs at the top of the page content area. Each tab is a sub-route (`/profile/resume`, `/profile/preferences`, etc.). Default tab is Resume & Experience. Tabs persist in the URL so users can bookmark or share links to specific sections.

---

## Routing Summary

| Route | Page | Description |
|---|---|---|
| `/` | Jobs | Browse and apply to matched jobs |
| `/applications` | Applications | Application history and stats |
| `/autopilot` | Autopilot | Configure auto-apply |
| `/profile` | Profile | Redirects to `/profile/resume` |
| `/profile/resume` | Profile > Resume & Experience | Resume, work history, skills |
| `/profile/preferences` | Profile > Job Preferences | What kind of jobs you want |
| `/profile/applications` | Profile > Application Preferences | Default application answers |
| `/profile/account` | Profile > Account | Email, billing, account management |
| `/onboarding` | Onboarding | First-time setup (unchanged) |
| `/login` | Login | Auth (unchanged) |
| `/signup` | Signup | Auth (unchanged) |

## Sidebar Navigation

Two groups:

**Main:**
- Jobs (home icon or briefcase)
- Applications (list/inbox icon)
- Autopilot (plane icon)

**Account:**
- Profile (user icon)

Settings is no longer a standalone sidebar item — it's the Account tab within Profile.

## Pages/Routes Removed from Navigation

| Old Route | What Happens |
|---|---|
| `/dashboard` | Removed. Home is now `/` (Jobs). |
| `/jobs` | Moved to `/`. |
| `/queue` | Replaced by `/applications`. |
| `/tracker` | Merged into `/applications`. |
| `/analytics` | Stats merged into `/applications` header. |
| `/settings` | Merged into `/profile/account`. |

## Components: Kept but Not Rendered

These components stay in the codebase but are no longer rendered in the new page layout:

- `ActivityFeed` — Dashboard activity log
- `WeeklyChart` — Dashboard weekly bar chart
- `AtsCoverage` — Dashboard ATS progress bars
- `StatsRow` — Dashboard 4-stat row
- `PipelineCard` — Dashboard pipeline boxes
- `ReviewList` / `BatchBar` — Queue batch review workflow
- `AnswerPreviewOverlay` — Queue answer preview panel
- `InFlightMonitor` — Queue in-flight status
- `TabBar` (Queue version) — 5-tab colored navigation

## Components Reused

- `ApplicationTable` — Applications page main table
- `TrackerStats` — Applications page stats bar (may need minor adaptation)
- `SidePanel` — Jobs page and Applications page (conditionally hide approve/reject buttons)
- `JobFilters`, `JobCard` — Jobs page (unchanged)
- `EngageCard`, `TargetingCard`, `ModeCard` — Autopilot page (unchanged)
- `ContactCard` — Profile > Account tab
- `ResumeCard` — Profile > Resume & Experience tab
- `ExperienceEditor` — Profile > Resume & Experience tab
- `SkillsEditor` — Profile > Resume & Experience tab
- `SubscriptionCard` — Profile > Account tab
- `AccountCard` — Profile > Account tab

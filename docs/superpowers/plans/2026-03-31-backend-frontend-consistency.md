# Backend-Frontend Consistency Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five backend-frontend inconsistencies: ATS field mismatch, missing job posting link, missing match data on application detail, missing failure reasons on failed applications, and missing ATS info on application detail.

**Architecture:** All changes are frontend-only except exposing `ats_platform` in the `JobResponse` schema. The side panel component gets extended with new sections for failure info and an external link. The applications page fetches match breakdown data like the jobs page already does.

**Tech Stack:** React 19, TypeScript, TanStack Query, FastAPI, Pydantic, SQLAlchemy

---

## Investigation Findings

### Issue 1: ATS Field Mismatch
- **DB model:** `Job.ats_platform` (e.g., "greenhouse", "lever.co", "workday", "ashby")
- **API schema:** `JobResponse` does NOT include `ats_platform` — only has `source` (always "adzuna" for API-fetched jobs)
- **Frontend application table:** Shows `app.job?.source` in the ATS column — this is wrong; `source` is the data provider, not the ATS
- **Frontend Job type:** Has no `ats_platform` field
- The ATS registry has 10 entries but the actual DB has 30+ distinct `ats_platform` values (greenhouse: 471, workday: 411, ashby: 246, etc.)

### Issue 2: Missing Job Posting Link
- `Job.url` and `Job.apply_url` are returned by the API and exist in the frontend `Job` type
- The v1 frontend had a "View on {source}" button — removed during v2 migration
- Side panel currently shows no way to open the original posting

### Issue 3: Application Detail Missing Match Data
- Jobs page passes `matchBreakdown` to `SidePanel` via `useJobDetail(selectedJobId)` which calls `/api/jobs/{id}/match`
- Applications page passes NO `matchBreakdown` — the `SidePanel` renders without tabs, only showing `JobInfoTab` inline
- The application already has `job_id` available via `app.job?.id`

### Issue 4: No Failure Reason Display
- Application-runner provides `reason` field (e.g., "max_vision_steps", "timeout_exceeded", "Page.evaluate: Target page closed", descriptive LLM messages)
- Backend stores this as `Application.error_message`
- Frontend `Application` type has `error_message` field
- Side panel never renders `error_message` for failed applications

### Issue 5: ATS Not Shown on Application Detail
- Application table shows ATS column using `app.job?.source` (wrong field as noted above)
- Side panel doesn't show ATS at all
- `generated_application.ats_name` from the runner is always `null` in current data
- The correct source is `Job.ats_platform`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/schemas/job.py` | Modify | Add `ats_platform` to `JobResponse` |
| `frontend/src-v2/types/job.ts` | Modify | Add `ats_platform` to `Job` interface |
| `frontend/src-v2/components/shared/side-panel.tsx` | Modify | Add external link, failure banner, ATS tag |
| `frontend/src-v2/pages/applications.tsx` | Modify | Fetch match breakdown for selected app's job |
| `frontend/src-v2/components/tracker/application-table.tsx` | Modify | Use `ats_platform` instead of `source` |
| `frontend/src-v2/hooks/use-job-detail.ts` | Read-only | Already works — reused by applications page |

---

### Task 1: Expose `ats_platform` in API Response

**Files:**
- Modify: `backend/schemas/job.py:46-83`
- Test: `backend/tests/test_jobs.py` (verify field present in response)

- [ ] **Step 1: Add `ats_platform` to `JobResponse` schema**

In `backend/schemas/job.py`, add after `source_domain` (line 71):

```python
ats_platform: str | None = None
```

This field already exists on the `Job` ORM model and `from_attributes=True` is set, so Pydantic will auto-populate it from `model_validate(job)`.

- [ ] **Step 2: Verify with existing tests**

Run: `cd backend && python -m pytest tests/test_jobs.py -v`
Expected: All existing tests pass (new field is optional, doesn't break anything).

- [ ] **Step 3: Commit**

```bash
git add backend/schemas/job.py
git commit -m "feat: expose ats_platform in JobResponse schema"
```

---

### Task 2: Add `ats_platform` to Frontend Job Type and Fix ATS Column

**Files:**
- Modify: `frontend/src-v2/types/job.ts:50-82`
- Modify: `frontend/src-v2/components/tracker/application-table.tsx:88-91`

- [ ] **Step 1: Add `ats_platform` to the `Job` TypeScript interface**

In `frontend/src-v2/types/job.ts`, add after the `source` field (line 72):

```typescript
ats_platform?: string | null;
```

- [ ] **Step 2: Fix the ATS column in the application table**

In `frontend/src-v2/components/tracker/application-table.tsx`, change line 90 from:

```tsx
{app.job?.source ?? "-"}
```

to:

```tsx
{app.job?.ats_platform ?? "-"}
```

- [ ] **Step 3: Verify frontend compiles**

Run: `cd frontend && pnpm typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src-v2/types/job.ts frontend/src-v2/components/tracker/application-table.tsx
git commit -m "fix: show ats_platform instead of source in application tracker ATS column"
```

---

### Task 3: Add Job Posting External Link to Side Panel

**Files:**
- Modify: `frontend/src-v2/components/shared/side-panel.tsx:546-574`

- [ ] **Step 1: Add the ExternalLink icon import**

In `frontend/src-v2/components/shared/side-panel.tsx`, update the icon import (line 8):

```tsx
import { X, Check, ExternalLink } from "@/icons";
```

If `ExternalLink` is not exported from `@/icons`, check `frontend/src-v2/icons/index.ts` and add it. It comes from `lucide-react`.

- [ ] **Step 2: Add the external link below the company block**

In `frontend/src-v2/components/shared/side-panel.tsx`, inside the company/meta section (after the quick facts `div` around line 573, before the closing `</div>` of the `space-y-4 px-5 pt-5 pb-3` container), add:

```tsx
{/* External link to job posting */}
{displayJob.url && (
  <a
    href={displayJob.apply_url || displayJob.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-pri hover:underline"
  >
    <ExternalLink size={12} />
    View job posting
  </a>
)}
```

This uses `apply_url` if available (direct application form), falling back to `url` (listing page).

- [ ] **Step 3: Verify frontend compiles**

Run: `cd frontend && pnpm typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src-v2/components/shared/side-panel.tsx
git commit -m "feat: add external link to job posting in side panel"
```

---

### Task 4: Show Match Data on Application Detail Panel

**Files:**
- Modify: `frontend/src-v2/pages/applications.tsx:1-92`

- [ ] **Step 1: Import `useJobDetail` and wire up match data**

In `frontend/src-v2/pages/applications.tsx`, add the import:

```tsx
import { useJobDetail } from "@/hooks/use-job-detail";
```

Then inside the component, after line 48 (`const panelJob: Job | null = ...`), add:

```tsx
const selectedJobId = selectedApp?.job_id ?? selectedApp?.job?.id ?? null;
const { job: jobDetail, match: matchDetail } = useJobDetail(selectedJobId);
```

- [ ] **Step 2: Pass match breakdown to SidePanel**

Replace the SidePanel usage (lines 84-89) with:

```tsx
<SidePanel
  job={jobDetail.data ?? panelJob}
  selectedJob={panelJob}
  application={selectedApp}
  matchBreakdown={matchDetail.data ?? null}
  isOpen={selectedApp !== null}
  isLoadingDetail={jobDetail.isLoading}
  isLoadingMatch={matchDetail.isLoading}
  onClose={handleClosePanel}
/>
```

- [ ] **Step 3: Verify frontend compiles**

Run: `cd frontend && pnpm typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src-v2/pages/applications.tsx
git commit -m "feat: show match breakdown in application detail side panel"
```

---

### Task 5: Show Failure Reason and ATS on Application Detail

**Files:**
- Modify: `frontend/src-v2/components/shared/side-panel.tsx:558-564`

- [ ] **Step 1: Add failure banner for failed applications**

In `frontend/src-v2/components/shared/side-panel.tsx`, inside the company/meta section, after the status badge block (around line 564, after the `{application && (<Badge ...>)}` block), add:

```tsx
{/* Failure reason */}
{application && application.status === "failed" && application.error_message && (
  <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5">
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-danger">
      Failure Reason
    </p>
    <p className="mt-1 font-sans text-[12px] leading-[1.6] text-t-700">
      {application.error_message}
    </p>
  </div>
)}
```

- [ ] **Step 2: Add ATS platform tag to the meta tags**

In the same file, find the `metaTags` array (around line 510). Add `ats_platform` as a tag. Replace:

```tsx
const metaTags = [
  displayJob.location,
  formatLocationType(displayJob.location_type),
  formatExperienceLevel(displayJob.experience_level),
  formatEmploymentType(displayJob.employment_type),
  formatSalaryRange(
    displayJob.salary_min,
    displayJob.salary_max,
    displayJob.salary_currency,
    ai?.salary,
  ),
].filter(Boolean);
```

with:

```tsx
const metaTags = [
  displayJob.ats_platform,
  displayJob.location,
  formatLocationType(displayJob.location_type),
  formatExperienceLevel(displayJob.experience_level),
  formatEmploymentType(displayJob.employment_type),
  formatSalaryRange(
    displayJob.salary_min,
    displayJob.salary_max,
    displayJob.salary_currency,
    ai?.salary,
  ),
].filter(Boolean);
```

This puts the ATS name (e.g., "greenhouse", "workday") as the first meta tag on both job and application detail panels.

- [ ] **Step 3: Verify frontend compiles**

Run: `cd frontend && pnpm typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src-v2/components/shared/side-panel.tsx
git commit -m "feat: show failure reason and ATS platform on application detail panel"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run backend tests**

Run: `cd backend && python -m pytest tests/ -v --tb=short`
Expected: All tests pass.

- [ ] **Step 2: Run frontend typecheck**

Run: `cd frontend && pnpm typecheck`
Expected: No errors.

- [ ] **Step 3: Run frontend lint**

Run: `cd frontend && pnpm lint`
Expected: No errors.

- [ ] **Step 4: Manual smoke test checklist**

Verify with `make dev` + `cd frontend && pnpm dev`:

1. Jobs page → click a job → side panel shows ATS as first meta tag + "View job posting" link
2. Applications page → click an application → side panel shows Match tab + Job Info tab (both populated)
3. Applications page → click a failed application → red failure reason banner visible
4. Applications table → ATS column shows actual ATS names (greenhouse, workday, etc.) not "adzuna"

- [ ] **Step 5: Commit any fixes, then final commit**

```bash
git add -A
git commit -m "chore: final verification pass for backend-frontend consistency fixes"
```

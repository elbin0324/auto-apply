# Phase 12 — Job Data Display Overhaul

> **Goal:** Replace meaningless `category`/`tags` display with relevant job metadata on the job card. Surface AI enrichment data on the side panel for richer job details.

---

## Problem

- **Job Card** displays `tags` (always `["ats", "greenhouse"]`) and `category` (always `"ats"`) — useless info
- **Side Panel** shows basic meta (location, location_type, employment_type, experience_level, salary) but ignores the rich `ai_enrichment` JSONB data
- The `ai_enrichment` field contains salary, skills, benefits, keywords, visa sponsorship, requirements summary, core responsibilities, etc. — all valuable for users
- Frontend `Job` type doesn't include `ai_enrichment` at all

---

## Plan

### Step 12.1 — Update Frontend Job Type

**File:** `frontend/src-v2/types/job.ts`

Add `AIEnrichment` interface matching the backend `AIEnrichment` Pydantic model:

```typescript
export interface AISalary {
  currency?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit_text?: string | null;
}

export interface AIEnrichment {
  salary?: AISalary | null;
  skills?: string[];
  benefits?: string[];
  keywords?: string[];
  taxonomies?: string[];
  education_level?: string[];
  visa_sponsorship?: boolean | null;
  working_hours?: number | null;
  job_language?: string | null;
  remote_location?: string | null;
  requirements_summary?: string | null;
  core_responsibilities?: string | null;
  work_arrangement_office_days?: number | null;
}
```

Add to `Job` interface:
- `ai_enrichment?: AIEnrichment | null;`
- `country?: string | null;`
- `city?: string | null;`

Remove `tags` from required field (make optional or remove entirely since it's useless).

---

### Step 12.2 — Add Salary Formatting Utility

**File:** `frontend/src-v2/lib/utils.ts`

Add a `formatSalaryRange` utility that:
1. First checks `salary_min`/`salary_max` (top-level, from enrichment worker)
2. Falls back to `ai_enrichment.salary.min_value`/`max_value` if top-level is null
3. Formats as `$140k–$200k/yr` (with currency and unit support)
4. Handles partial values: `$140k+`, `Up to $200k`

Add a `formatLocationDisplay` utility:
1. Uses `city` + `country` if available, falls back to `location`
2. Appends location_type badge text: `Remote`, `Hybrid`, `On-site`

---

### Step 12.3 — Redesign Job Card Metadata

**File:** `frontend/src-v2/components/jobs/job-card.tsx`

Replace the current tags display with meaningful metadata badges. The card metadata row should show (in this priority order, space permitting):

1. **Location** — `job.location` or `job.city` (shown as text in meta line, already there)
2. **Work arrangement** — `Remote` / `Hybrid` / `On-site` badge (from `location_type`)
3. **Experience level** — `Entry` / `Mid` / `Senior` / `Lead` badge (from `experience_level`)
4. **Employment type** — `Full-time` / `Contract` / `Part-time` badge (from `employment_type`)
5. **Salary** — formatted salary range (from salary fields or AI enrichment fallback)

Layout change:
- **Line 1 (existing):** Job title
- **Line 2 (existing meta, enhanced):** Company / Location / Salary (using new formatter)
- **Line 3 (new badges):** Up to 3-4 small badges for: location_type, experience_level, employment_type. Only show badges that have data — no "Unknown" or "N/A" badges.

Remove the `tags` display entirely from the job card.

---

### Step 12.4 — Enhance Side Panel with AI Enrichment

**File:** `frontend/src-v2/components/shared/side-panel.tsx`

Restructure the side panel content into clear sections. The panel already shows match data well — we're adding job detail sections above/around it.

#### Section order (top to bottom):

1. **Header** (existing) — Company logo + title + company name
2. **Status badge** (existing, if application)
3. **Quick Facts row** (redesigned meta tags) — location, location_type, experience_level, employment_type, salary range. Use the enhanced formatter. Show only what's available.
4. **Salary Detail** (new, from AI enrichment) — If `ai_enrichment.salary` exists, show: `$140,000 – $200,000 / year · USD`. If benefits exist, show as small badges below (e.g., `Bonus`, `Stock`, `401k`).
5. **Job Details** (new section) — Collapsible or always-visible section with:
   - **Visa Sponsorship** — `Yes` or `No` badge (only show if `visa_sponsorship` is not null)
   - **Working Hours** — e.g., `40 hrs/week` (only if available)
   - **Education** — comma-separated list (only if `education_level` is non-empty)
   - **Work Arrangement** — e.g., `3 days in office` (only if `work_arrangement_office_days` is not null)
6. **Requirements Summary** (new) — `ai_enrichment.requirements_summary` as a paragraph. Section header: "Requirements". Only show if available.
7. **Core Responsibilities** (new) — `ai_enrichment.core_responsibilities` as a paragraph. Section header: "Responsibilities". Only show if available.
8. **Skills & Keywords** (new) — Show `ai_enrichment.skills` as colored badges (pri color). If skills is empty, show top keywords from `ai_enrichment.keywords` instead (limit to 8-10). Section header: "Skills".
9. **Match Score** (existing) — Score circle + label
10. **Match Breakdown** (existing) — Summary, Strengths, Concerns, Key Matches/Gaps
11. **Action buttons** (existing) — Apply / Approve / Reject

#### Display rules:
- All AI enrichment sections are conditional — only render if data exists
- No "N/A" or "No data" placeholders — if empty, section is simply omitted
- Maintain existing styling conventions (SectionHeader component, font-mono labels, font-sans body text)

---

### Step 12.5 — Update MatchBreakdown Type

**File:** `frontend/src-v2/types/job.ts`

The current `MatchBreakdown` interface doesn't match `MatchBreakdownResponse` from the backend. Update to include:
- `summary?: string | null`
- `strengths?: string[]`
- `concerns?: string[]`
- `key_matches?: string[]`
- `key_gaps?: string[]`
- `score?: number`
- `label?: string`
- `computed_at?: string`

Update the side panel to use `summary` (not just `reasoning`) and show `strengths`/`concerns` and `key_matches`/`key_gaps` from the breakdown response rather than just `matched_skills`/`missing_skills` from factors.

---

### Step 12.6 — Remove Category Filter (Optional Cleanup)

**Files:** `frontend/src-v2/components/jobs/job-filters.tsx`, `frontend/src-v2/hooks/use-jobs.ts`

- Confirm `category` is not used in any filter UI (it isn't currently)
- Remove `category` from the `Job` type (it adds no user value)
- Keep `tags` as optional in the type but don't display it anywhere

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src-v2/types/job.ts` | Add AIEnrichment, AISalary interfaces; add ai_enrichment, country, city to Job; update MatchBreakdown |
| `frontend/src-v2/lib/utils.ts` | Add formatSalaryRange, formatLocationDisplay utilities |
| `frontend/src-v2/components/jobs/job-card.tsx` | Replace tags with location_type/experience/employment badges + better salary |
| `frontend/src-v2/components/shared/side-panel.tsx` | Add AI enrichment sections (salary, requirements, responsibilities, skills, job details) |

## No Backend Changes Required

The backend already returns `ai_enrichment` as part of `JobResponse`. The frontend simply needs to consume and display it. No new API endpoints or schema changes needed.

---

## Design Decisions

1. **No "Unknown" badges** — If data isn't available, omit the element entirely. Users won't miss what they don't see, and showing "Unknown" for 50% of fields would look broken.

2. **AI enrichment as progressive enhancement** — The basic card and panel work with just top-level fields (title, company, location, salary, match score). AI enrichment adds richer detail when available. This graceful degradation means the UI works well for both enriched and non-enriched jobs.

3. **Salary fallback chain** — Top-level `salary_min`/`salary_max` → `ai_enrichment.salary` → nothing. This handles the case where enrichment worker set the top-level fields, or where only the API-sourced AI data has salary info.

4. **Skills vs Keywords** — Prefer `skills` array when available (more curated). Fall back to `keywords` (more raw, from the API). Limit display to prevent overwhelming the user.

5. **Remove tags from card** — The current tags (`["ats", "greenhouse"]`) provide zero user value. Replace entirely with structured metadata badges that actually help users evaluate jobs at a glance.

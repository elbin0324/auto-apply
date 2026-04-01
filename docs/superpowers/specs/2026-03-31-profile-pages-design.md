# Profile Pages Overhaul — Spec

**Date:** 2026-03-31
**Goal:** Build out the 4 profile section pages (Resume, Job Preferences, App Preferences, Account) to properly surface what the backend supports, with a form-per-section architecture where each card saves independently.

---

## Design Principles

- Each page is a vertical stack of independent card sections
- Each section has its own save/cancel or auto-saves on change (debounced)
- No modals — everything edits inline
- Reuse existing UI primitives (Card, TagInput, Input, Select, Button, Badge)
- Follow existing component patterns (ExperienceEditor, SkillsEditor)
- No components are deleted — reworked components replace their usage on these pages

---

## Page 1: Resume (`/profile/resume`)

**Purpose:** Manage your resume document, contact info, professional summary, work history, education, and skills.

### Section 1: Resume Document Card (`ResumeDocCard`)

**No resume uploaded:**
- Drop zone for drag-and-drop or click-to-upload
- Accepts PDF only, 10MB max
- Reuses existing DropZone pattern from `resume-card.tsx`

**Resume uploaded:**
- PDF embed/preview (use `<object>` or `<iframe>` with the resume URL for inline viewing, with a fallback to a file-info display if embed fails)
- File metadata: filename, file size, upload date
- Parse status badge: "Parsed" (green) or "Not Parsed" (yellow)
- "Replace" button: triggers file picker for new upload
- "Re-parse" button: re-runs `POST /api/profile/resume/parse` on existing file

**Upload flow:**
1. User uploads PDF → `POST /api/profile/resume/upload`
2. On success, auto-parse → `POST /api/profile/resume/parse`
3. On parse success, invalidate profile query (experiences/education/skills refresh)
4. Show toast: "Resume parsed — review your profile below"

**Re-parse flow:**
1. User clicks "Re-parse" → `POST /api/profile/resume/parse`
2. Same invalidation + toast as upload

**Data:** `profile.raw_resume_url`, `profile.resume_updated_at`, `useResumeUpload()` hook

### Section 2: Contact Info Card

Existing `ContactCard` component, moved here from Account page. No functional changes.

**Fields (inline-editable):**
- Full name
- Email
- Phone
- Location
- LinkedIn URL
- Website URL

**Interactions:** Click "Edit" → fields become editable → "Save" calls `useUpdateProfile()` → "Cancel" reverts.

**Data:** `profile.full_name`, `profile.email`, `profile.phone`, `profile.location`, `profile.linkedin_url`, `profile.website_url`

### Section 3: Professional Summary Card (`SummaryCard`)

New component.

- Single textarea displaying `profile.summary`
- Edit/Save/Cancel pattern
- "Save" calls `useUpdateProfile({ summary: value })`

### Section 4: Experience Card

Existing `ExperienceEditor` component, unchanged.

**Fields per entry:** title, company, location, start date, end date, bullet points
**Interactions:** Add, edit (inline form), delete
**Data:** `profile.experiences`, `useUpdateExperiences()`

### Section 5: Education Card (`EducationEditor`)

New component, same pattern as ExperienceEditor.

**Fields per entry:**
- Institution (required)
- Degree (e.g., "Bachelor's", "Master's", "PhD")
- Field of study (e.g., "Computer Science")
- Start date, end date
- GPA

**Interactions:** Add, edit (inline form via `EducationForm`), delete. Submit calls `useUpdateEducation()` which sends `PUT /api/profile/education` with the full array (bulk replace, same pattern as experiences).

**New hook:** `useUpdateEducation()` — same pattern as `useUpdateExperiences()`:
```
PUT /api/profile/education
Body: EducationCreate[]
Invalidates: ["profile"]
```

**New component:** `EducationForm` — same pattern as `ExperienceForm`:
- Fields: institution, degree, field_of_study, start_date, end_date, gpa
- Save/Cancel buttons
- Helpers: `toFormData()`, `fromFormData()`

### Section 6: Skills Card

Existing `SkillsEditor` component, unchanged.

**Data:** `profile.skills`, `useUpdateSkills()`

---

## Page 2: Job Preferences (`/profile/preferences`)

**Purpose:** Configure what kind of jobs you want. These settings are the source of truth — Autopilot reads from them. All fields live on the `AutoApplyConfig` model.

**Data source:** `useAutoApplyConfig()` / `useUpdateAutoApplyConfig()` — same hooks Autopilot uses. No new endpoints needed.

**Save behavior:** All sections auto-save on change with 1s debounce (same pattern as current Autopilot targeting/mode cards).

### Section 1: Job Titles Card

- `TagInput` for target job titles
- Placeholder: "e.g., Software Engineer, Backend Developer"
- Saves to `config.target_titles`

### Section 2: Location Preferences Card

- `TagInput` for target locations (e.g., "Toronto", "New York", "Remote")
- Checkbox group for location type preference: Remote, Hybrid, On-site (multi-select)
- Saves to `config.target_locations` and `config.location_type_pref`

### Section 3: Salary Range Card

- Two number inputs: Minimum and Maximum
- Placeholder text showing currency context
- Saves to `config.min_salary`, `config.max_salary`

### Section 4: Employment Preferences Card

- Checkbox group for employment type: Full-time, Part-time, Contract, Internship (multi-select)
- Dropdown/select for experience level: Entry, Mid, Senior, Lead, Executive (single-select)
- Saves to `config.employment_type_pref`, `config.experience_level`

### Section 5: Exclusions & Industries Card

- `TagInput` for excluded companies (danger variant — red tags)
- `TagInput` for preferred industries
- Saves to `config.excluded_companies`, `config.preferred_industries`

---

## Page 3: App Preferences (`/profile/applications`)

**Purpose:** Set default answers for common application form questions. The agent uses these when filling out applications on your behalf.

**Data source:** New `useApplicationPreferences()` hook:
- Read: `GET /api/profile/preferences` → `ApplicationPreferences | null`
- Write: `PUT /api/profile/preferences` → `ApplicationPreferences`
- Query key: `["application-preferences"]`

**Save behavior:** Auto-save on change with 1s debounce. The PUT endpoint merges `custom_answers` (adds/updates keys, doesn't replace), and supports partial updates on all fields.

### Section 1: Work Authorization Card

Boolean toggle fields (yes/no or null for "not set"):
- Authorized to work in the US (`authorized_us`)
- Authorized to work in Canada (`authorized_ca`)
- Requires visa sponsorship (`requires_sponsorship`)

Use a three-state toggle or radio: Yes / No / Not Set. "Not Set" means the agent won't pre-fill this answer.

### Section 2: Availability Card

- Willing to relocate: yes/no toggle (`willing_to_relocate`)
- Earliest start date: date input (`earliest_start_date`)
- Notice period: number input with "days" suffix (`notice_period_days`)

### Section 3: Compensation Card

- Desired salary min/max: two number inputs (`desired_salary_min`, `desired_salary_max`)
- Currency: dropdown (`salary_currency`, default "USD")

Note: This is separate from Job Preferences salary range. Job Preferences controls which jobs you *see*. This is what the agent *answers* when a form asks "What is your desired salary?"

### Section 4: Background & Legal Card

Boolean toggle fields:
- Over 18 (`over_18`)
- Has driver's license (`has_drivers_license`)
- Felony conviction (`felony_conviction`)

Text input:
- "How did you hear about us?" default answer (`how_did_you_hear`)

### Section 5: Custom Answers Card (`CustomAnswersEditor`)

New component — key-value row editor.

**Layout:** Each row has two fields side by side:
- Question (text input, left, wider)
- Answer (text input, right)
- Delete button (X icon, far right)

**Interactions:**
- "Add Answer" button appends a new empty row
- Typing in either field auto-saves (debounced)
- Click X removes the row (saves immediately)
- Empty rows (both fields blank) are not saved

**Data:** `application_preferences.custom_answers` — `Record<string, string>` where key is the question and value is the answer.

**Examples:**
- "Do you have a security clearance?" → "No"
- "Years of Python experience?" → "8"
- "Are you willing to work weekends?" → "Occasionally, if needed"

---

## Page 4: Account (`/profile/account`)

**Purpose:** Manage subscription, billing, and account settings. Intentionally minimal.

### Section 1: Subscription Card (reworked)

**No subscription:**
- Message: "No active subscription"
- "Subscribe" button → `useCheckout()` → redirects to Stripe checkout

**Active subscription:**
- Plan name + status badge (active / past due / canceled)
- Usage: "X of Y applications used this month" with a progress bar (from `useSubscription()` — `applications_used` / `quota`)
- Remaining count
- Current period end date
- "Manage Subscription" button → `usePortalSession()` → redirects to Stripe customer portal

**Data:** `useSubscription()`, `usePlans()`, `useCheckout()`, `usePortalSession()`

### Section 2: Account Card

- Email (read-only, displayed from auth store)
- "Sign Out" button → `useAuth().logout()` → redirects to `/login`
- Danger zone section:
  - "Delete Account" button — disabled with tooltip "Coming soon"

---

## New Components Summary

| Component | Location | Purpose |
|---|---|---|
| `ResumeDocCard` | `components/profile/resume-doc-card.tsx` | PDF preview, upload/replace, re-parse |
| `SummaryCard` | `components/profile/summary-card.tsx` | Professional summary textarea with edit/save |
| `EducationEditor` | `components/profile/education-editor.tsx` | Education list with add/edit/delete |
| `EducationForm` | `components/profile/education-form.tsx` | Inline form for education entries |
| `CustomAnswersEditor` | `components/profile/custom-answers-editor.tsx` | Key-value row editor for custom Q&A |
| `JobPreferencesPage` | `pages/job-preferences.tsx` | New page for job preference settings |
| `AppPreferencesPage` | `pages/app-preferences.tsx` | New page for application preference settings |

## New Hooks Summary

| Hook | File | Endpoint | Purpose |
|---|---|---|---|
| `useUpdateEducation()` | `hooks/use-profile.ts` | `PUT /api/profile/education` | Bulk replace education entries |
| `useApplicationPreferences()` | `hooks/use-application-preferences.ts` | `GET /api/profile/preferences` | Read application preferences |
| `useUpdateApplicationPreferences()` | `hooks/use-application-preferences.ts` | `PUT /api/profile/preferences` | Write application preferences |

## Reworked Components

| Component | What changes |
|---|---|
| `ResumeCard` (`resume-card.tsx`) | Replaced by `ResumeDocCard` — adds PDF preview, replace button, re-parse button |
| `SubscriptionCard` (`subscription-card.tsx`) | Enhanced with usage progress bar, plan management, Stripe portal/checkout integration |

## Components Reused As-Is

- `ContactCard` — moved to Resume page, no functional changes
- `ExperienceEditor` + `ExperienceForm`
- `SkillsEditor`
- `TagInput`
- `AccountCard` — on Account page, no changes
- All UI primitives (Card, Button, Input, Select, Badge, SkeletonCard)

## Page File Changes

| Current file | What happens |
|---|---|
| `pages/profile.tsx` | Rewritten — becomes a router that renders the correct page based on path |
| New: `pages/job-preferences.tsx` | Job Preferences page content |
| New: `pages/app-preferences.tsx` | App Preferences page content |
| New: `pages/account.tsx` | Account page content |
| New: `pages/resume.tsx` | Resume page content |

The existing `profile.tsx` dispatches to the correct page component based on URL path. Alternatively, each page can be its own lazy-loaded route component — either approach works with the current router setup where all `/profile/*` routes render `ProfilePage`.

**Recommended approach:** Split into separate page files (`resume.tsx`, `job-preferences.tsx`, `app-preferences.tsx`, `account.tsx`) and have `profile.tsx` import and render the correct one based on path. This keeps each page focused and independently editable.

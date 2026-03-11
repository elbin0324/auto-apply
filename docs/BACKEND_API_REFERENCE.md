# AutoApply Backend API Reference

> **Purpose:** This document is the complete, authoritative reference for every externally-facing
> capability of the AutoApply backend. A frontend developer or agent should be able to rebuild
> the entire UI from this document alone — no backend code reading required.
>
> **Base URL:** Configured via `VITE_API_URL` (default: `http://localhost:8000`)
>
> **API Docs:** `{BASE_URL}/docs` (Swagger UI), `{BASE_URL}/redoc` (ReDoc), `{BASE_URL}/openapi.json`
>
> **CORS:** All origins listed in the backend's `ALLOWED_ORIGINS` env var are permitted. Credentials are allowed. All methods and headers are allowed.

---

## Table of Contents

1. [Authentication & Session Management](#1-authentication--session-management)
2. [Profile Management](#2-profile-management)
3. [Resume Upload & Parsing](#3-resume-upload--parsing)
4. [Application Preferences](#4-application-preferences)
5. [Jobs — Search, Scoring & Actions](#5-jobs--search-scoring--actions)
6. [Auto-Apply Configuration & Control](#6-auto-apply-configuration--control)
7. [Applications — Tracking & Review](#7-applications--tracking--review)
8. [Admin Dashboard](#8-admin-dashboard)
9. [Health Check](#9-health-check)
10. [Enums, Statuses & Constants](#10-enums-statuses--constants)
11. [Error Handling](#11-error-handling)
12. [Data Type Reference](#12-data-type-reference)

---

## 1. Authentication & Session Management

Authentication uses **Supabase Auth**. The backend verifies Supabase JWTs. The frontend obtains tokens from the Supabase JS client and attaches them to every API request.

**Auth header format:** `Authorization: Bearer {supabase_jwt}`

On any **401 response**, the frontend should attempt a token refresh via `supabase.auth.refreshSession()` and retry the request once.

### User Roles

| Role | Access |
|------|--------|
| `"user"` | All `/api/auth`, `/api/profile`, `/api/jobs`, `/api/auto-apply`, `/api/applications` endpoints |
| `"admin"` | Everything above + all `/api/admin` endpoints |

---

### `POST /api/auth/signup`

Create a new user account.

- **Auth:** None (public)
- **Status:** `201 Created`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** [`UserResponse`](#userresponse)
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "onboarding_completed": false
}
```

---

### `POST /api/auth/login`

Sign in with email and password. Returns Supabase JWT tokens.

- **Auth:** None (public)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** [`TokenResponse`](#tokenresponse)
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc...",
  "token_type": "bearer"
}
```

---

### `POST /api/auth/oauth/google`

Get the Supabase OAuth URL for Google sign-in. Redirect the user to the returned URL.

- **Auth:** None (public)

**Response:**
```json
{
  "url": "https://your-project.supabase.co/auth/v1/authorize?provider=google&..."
}
```

---

### `GET /api/auth/oauth/callback?code={code}`

OAuth callback handler. Supabase exchanges the code server-side.

- **Auth:** None (public)
- **Query Params:** `code` (string, required) — the OAuth authorization code
- **Response:** HTTP 302 redirect to `/?access_token={access_token}`
- **Note:** This is handled automatically by the OAuth flow. The frontend extracts the token from the redirect URL.

---

### `POST /api/auth/logout`

Sign out and invalidate the current session.

- **Auth:** `Authorization: Bearer {token}`
- **Status:** `204 No Content`
- **Response:** Empty

---

### `GET /api/auth/me`

Get the current authenticated user. Auto-creates a local user record if only an OAuth user exists in Supabase.

- **Auth:** `Authorization: Bearer {token}`

**Response:** [`UserResponse`](#userresponse)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "onboarding_completed": false
}
```

---

### `POST /api/auth/complete-onboarding`

Mark onboarding as complete. Triggers an initial 7-day job fetch in the background.

- **Auth:** JWT (CurrentUser)
- **Validation:**
  - Profile must have `full_name` and `email` set
  - AutoApplyConfig must have `target_titles` set (at least one)
- **Side Effects:** Enqueues background job fetch for the user

**Response:** [`UserResponse`](#userresponse) with `onboarding_completed: true`

**Errors:**
- `400` — Profile or config missing required fields

---

## 2. Profile Management

### `GET /api/profile`

Get or create the user's profile. If no profile exists, an empty one is created and returned.

- **Auth:** JWT (CurrentUser)

**Response:** [`ProfileResponse`](#profileresponse)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0100",
  "location": "Toronto, ON",
  "linkedin_url": "https://linkedin.com/in/janedoe",
  "website_url": "https://janedoe.com",
  "summary": "Senior software engineer with 8 years...",
  "raw_resume_url": "https://storage.supabase.co/...",
  "resume_updated_at": "2024-01-15T10:30:00Z",
  "application_preferences": { ... },
  "experiences": [ ... ],
  "educations": [ ... ],
  "skills": [ ... ]
}
```

---

### `PUT /api/profile`

Update profile contact/bio fields. Only provided fields are updated.

- **Auth:** JWT (CurrentUser)

**Request:** [`ProfileUpdate`](#profileupdate) — all fields optional
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0100",
  "location": "Toronto, ON",
  "linkedin_url": "https://linkedin.com/in/janedoe",
  "website_url": "https://janedoe.com",
  "summary": "Senior software engineer with 8 years..."
}
```

**Response:** [`ProfileResponse`](#profileresponse)

---

### `PUT /api/profile/experiences`

**Bulk replace** all work experiences. Deletes all existing experiences and inserts the provided list.

- **Auth:** JWT (CurrentUser)

**Request:** `ExperienceCreate[]`
```json
[
  {
    "company": "Acme Corp",
    "title": "Senior Engineer",
    "location": "Remote",
    "start_date": "2020-03-01",
    "end_date": null,
    "description": "Led backend team...",
    "bullets": [
      "Increased API throughput by 3x",
      "Mentored 4 junior engineers"
    ],
    "sort_order": 0
  }
]
```

**Response:** `ExperienceResponse[]` — same fields plus `id` and `profile_id`

---

### `PUT /api/profile/education`

**Bulk replace** all education records.

- **Auth:** JWT (CurrentUser)

**Request:** `EducationCreate[]`
```json
[
  {
    "institution": "University of Toronto",
    "degree": "Bachelor of Science",
    "field_of_study": "Computer Science",
    "start_date": "2012-09-01",
    "end_date": "2016-06-15",
    "gpa": "3.8",
    "sort_order": 0
  }
]
```

**Response:** `EducationResponse[]` — same fields plus `id` and `profile_id`

---

### `PUT /api/profile/skills`

**Bulk replace** all skills.

- **Auth:** JWT (CurrentUser)

**Request:** `SkillCreate[]`
```json
[
  {
    "name": "Python",
    "category": "technical",
    "proficiency": "expert"
  },
  {
    "name": "Project Management",
    "category": "soft_skills",
    "proficiency": "intermediate"
  }
]
```

**Response:** `SkillResponse[]` — same fields plus `id` and `profile_id`

---

## 3. Resume Upload & Parsing

### `POST /api/profile/resume/upload`

Upload a resume PDF file.

- **Auth:** JWT (CurrentUser)
- **Content-Type:** `multipart/form-data`
- **Validation:** PDF only, max 10 MB
- **Side Effects:** Uploads to Supabase Storage, updates `raw_resume_url` and `resume_updated_at`

**Request:**
```
POST /api/profile/resume/upload
Content-Type: multipart/form-data

file: <binary PDF data>
```

**Response:** [`ProfileResponse`](#profileresponse) — with updated `raw_resume_url` and `resume_updated_at`

**Errors:**
- `400` — File is not PDF or exceeds 10 MB

---

### `POST /api/profile/resume/parse`

Parse the uploaded resume using Claude AI. Extracts structured data and auto-populates profile fields (experiences, education, skills, contact info).

- **Auth:** JWT (CurrentUser)
- **Prerequisite:** Resume must be uploaded first via `/api/profile/resume/upload`
- **Note:** This is an LLM call and may take several seconds

**Response:** [`ParsedResume`](#parsedresume)
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0100",
  "location": "Toronto, ON",
  "linkedin_url": "https://linkedin.com/in/janedoe",
  "website_url": null,
  "summary": "Senior software engineer with 8 years of experience...",
  "experiences": [
    {
      "company": "Acme Corp",
      "title": "Senior Engineer",
      "location": "Remote",
      "start_date": "2020-03-01",
      "end_date": null,
      "description": "Led backend team...",
      "bullets": ["Increased API throughput by 3x"],
      "sort_order": 0
    }
  ],
  "educations": [
    {
      "institution": "University of Toronto",
      "degree": "BSc",
      "field_of_study": "Computer Science",
      "start_date": "2012-09-01",
      "end_date": "2016-06-15",
      "gpa": "3.8",
      "sort_order": 0
    }
  ],
  "skills": [
    { "name": "Python", "category": "technical", "proficiency": "expert" }
  ],
  "raw_text": "Full extracted text from the PDF..."
}
```

**Errors:**
- `400` — No resume uploaded yet

---

### `GET /api/profile/resume/parsed`

Get the previously parsed resume data (cached from the last parse).

- **Auth:** JWT (CurrentUser)

**Response:** [`ParsedResume`](#parsedresume)

**Errors:**
- `404` — No parsed resume exists

---

## 4. Application Preferences

Preferences are pre-set answers to common job application screening questions. The agent workers use these when filling out job application forms.

### `GET /api/profile/preferences`

Get the user's application preferences.

- **Auth:** JWT (CurrentUser)

**Response:** [`ApplicationPreferences`](#applicationpreferences) or `null`
```json
{
  "authorized_us": true,
  "authorized_ca": true,
  "requires_sponsorship": false,
  "willing_to_relocate": false,
  "earliest_start_date": "2024-03-01",
  "notice_period_days": 14,
  "desired_salary_min": 120000,
  "desired_salary_max": 160000,
  "salary_currency": "USD",
  "over_18": true,
  "has_drivers_license": true,
  "felony_conviction": false,
  "how_did_you_hear": "LinkedIn",
  "custom_answers": {
    "Are you willing to work weekends?": "Occasionally, yes",
    "Do you have a security clearance?": "No"
  }
}
```

---

### `PUT /api/profile/preferences`

Update application preferences. Only provided fields are updated. `custom_answers` is **merged** (not replaced) — new keys are added, existing keys are updated.

- **Auth:** JWT (CurrentUser)

**Request:** [`ApplicationPreferencesUpdate`](#applicationpreferencesupdate) — all fields optional

**Response:** [`ApplicationPreferences`](#applicationpreferences)

---

## 5. Jobs — Search, Scoring & Actions

### `GET /api/jobs`

List jobs scored and personalized for the current user. Only returns jobs that have been scored (have a `JobMatchScore` record).

- **Auth:** JWT (CurrentUser)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | — | Full-text search on title, company, description |
| `location` | string | — | Location filter (case-insensitive partial match) |
| `location_type` | string[] | — | Filter: `"remote"`, `"hybrid"`, `"onsite"` |
| `salary_min` | number | — | Minimum salary filter |
| `category` | string | — | Job category filter |
| `source` | string | — | Job source: `"adzuna"`, `"ats"`, etc. |
| `experience_level` | string[] | — | Filter: `"entry"`, `"mid"`, `"senior"`, `"lead"`, `"executive"` |
| `employment_type` | string[] | — | Filter: `"full_time"`, `"part_time"`, `"contract"`, `"internship"` |
| `status` | string | — | Application status filter: `"new"`, `"pending_review"`, `"queued"`, `"applied"`, `"skipped"`, `"in_progress"`, `"failed"` |
| `page` | integer | `1` | Page number (min 1) |
| `per_page` | integer | `20` | Results per page (1–100) |
| `sort_by` | string | `"match_score"` | Sort: `"match_score"`, `"salary"`, `"posted_at"` |

**Response:** [`JobListResponse`](#joblistresponse)
```json
{
  "jobs": [
    {
      "id": "uuid",
      "external_id": "adzuna_12345",
      "title": "Senior Backend Engineer",
      "company": "Acme Corp",
      "company_logo_url": "https://...",
      "location": "Toronto, ON",
      "location_type": "hybrid",
      "salary_min": 130000,
      "salary_max": 170000,
      "salary_currency": "CAD",
      "description": "We are looking for...",
      "description_clean": "Cleaned version...",
      "requirements": {
        "required_skills": ["Python", "FastAPI"],
        "preferred_skills": ["Redis", "Docker"],
        "education": "BS in Computer Science",
        "benefits": ["Health insurance", "Remote days"],
        "key_responsibilities": ["Design APIs", "Lead team"],
        "visa_sponsorship": false
      },
      "experience_level": "senior",
      "employment_type": "full_time",
      "years_experience_min": 5,
      "years_experience_max": 10,
      "enriched_at": "2024-01-15T10:00:00Z",
      "tags": ["python", "backend", "senior"],
      "url": "https://acme.com/jobs/12345",
      "apply_url": "https://acme.com/apply/12345",
      "source": "adzuna",
      "category": "Engineering",
      "posted_at": "2024-01-10T00:00:00Z",
      "is_active": true,
      "match_score": 87.5,
      "match_factors": {
        "combined_method": "llm",
        "model": "claude-haiku-4-5-20251001",
        "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
        "missing_skills": ["Go"],
        "preferred_skills": ["Redis"],
        "reasoning": "Strong match on core requirements...",
        "batch_id": "abc123",
        "latency_ms": 850
      },
      "application_status": null,
      "application_id": null
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "pages": 8
}
```

**Note on `application_status`:**
- `null` means the job has not been acted on yet (effectively `"new"`)
- Otherwise it will be one of the [`ApplicationStatus`](#applicationstatus-enum) values

---

### `GET /api/jobs/{job_id}`

Get a single job with match score and application status.

- **Auth:** JWT (CurrentUser)
- **Path Params:** `job_id` (UUID)

**Response:** [`JobResponse`](#jobresponse)

**Errors:**
- `404` — Job not found

---

### `GET /api/jobs/{job_id}/match`

Get detailed match score breakdown for a job.

- **Auth:** JWT (CurrentUser)
- **Path Params:** `job_id` (UUID)

**Response:**
```json
{
  "job_id": "uuid",
  "score": 87.5,
  "factors": {
    "combined_method": "llm",
    "model": "claude-haiku-4-5-20251001",
    "matched_skills": ["Python", "FastAPI"],
    "missing_skills": ["Go"],
    "preferred_skills": ["Redis"],
    "reasoning": "Strong match on core requirements...",
    "batch_id": "abc123",
    "latency_ms": 850
  },
  "computed_at": "2024-01-15T10:00:00Z"
}
```

**Errors:**
- `404` — No match score computed for this job

---

### `POST /api/jobs/{job_id}/queue`

Manually queue a job for auto-apply. Creates an Application record with status `"queued"` and pushes an `ApplyTask` to the Redis queue for agent workers.

- **Auth:** JWT (CurrentUser)
- **Path Params:** `job_id` (UUID)

**Validation:**
- Job must exist and be active
- User must have a match score for this job
- Cannot queue if application is already `"queued"` or `"in_progress"`
- Cannot queue if already `"applied"`
- Respects `daily_apply_limit` from auto-apply config

**Response:**
```json
{
  "application_id": "uuid",
  "status": "queued"
}
```

**Errors:**
- `404` — Job not found
- `400` — Already queued/in-progress/applied, or daily limit reached
- `409` — No match score exists

---

### `POST /api/jobs/{job_id}/skip`

Skip a job. Creates or updates an Application with status `"skipped"`.

- **Auth:** JWT (CurrentUser)
- **Path Params:** `job_id` (UUID)

**Validation:**
- Cannot skip if already `"queued"` or `"in_progress"`
- Cannot skip if already `"applied"`

**Response:**
```json
{
  "application_id": "uuid",
  "status": "skipped"
}
```

---

### `POST /api/jobs/{job_id}/unskip`

Undo a skip. Deletes the `"skipped"` Application so the job returns to `"new"` state.

- **Auth:** JWT (CurrentUser)
- **Path Params:** `job_id` (UUID)

**Response:**
```json
{
  "status": "new"
}
```

**Errors:**
- `404` — No skipped application found for this job

---

### `POST /api/jobs/rescore`

Trigger rescoring of all active jobs for the current user. Enqueues a background scoring task.

- **Auth:** JWT (CurrentUser)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `force` | boolean | `false` | If true, clears existing scores and rescores everything |

**Response:**
```json
{
  "detail": "Queued scoring task for user",
  "force": false
}
```

---

## 6. Auto-Apply Configuration & Control

### `GET /api/auto-apply/config`

Get or create the user's auto-apply configuration. If no config exists, a default one is created.

- **Auth:** JWT (CurrentUser)

**Response:** [`AutoApplyConfigResponse`](#autoapplyconfigresponse)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "is_active": false,
  "target_titles": ["Software Engineer", "Backend Developer"],
  "target_locations": ["Toronto", "Remote"],
  "min_salary": 100000,
  "max_salary": null,
  "excluded_companies": ["BadCorp"],
  "preferred_industries": ["Technology", "Fintech"],
  "location_type_pref": ["remote", "hybrid"],
  "employment_type_pref": ["full_time"],
  "experience_level": "senior",
  "daily_apply_limit": 25,
  "apply_mode": "safe",
  "auto_apply_threshold": 70
}
```

---

### `PUT /api/auto-apply/config`

Update auto-apply configuration. Only provided fields are updated.

- **Auth:** JWT (CurrentUser)
- **Side Effects:** If the config becomes active with target titles, enqueues a job fetch in the background.

**Request:** [`AutoApplyConfigUpdate`](#autoapplyconfigupdate) — all fields optional
```json
{
  "target_titles": ["Software Engineer"],
  "target_locations": ["Remote"],
  "min_salary": 120000,
  "daily_apply_limit": 15,
  "apply_mode": "hybrid",
  "auto_apply_threshold": 80
}
```

**Field constraints:**
- `daily_apply_limit`: 1–100
- `apply_mode`: `"safe"`, `"hybrid"`, or `"auto"`
- `auto_apply_threshold`: 15–100

**Response:** [`AutoApplyConfigResponse`](#autoapplyconfigresponse)

---

### Apply Modes Explained

| Mode | Behavior |
|------|----------|
| `"safe"` | All matched jobs go to `"pending_review"` — user must approve each one before it's queued |
| `"hybrid"` | Jobs scoring above `auto_apply_threshold` are auto-queued; others go to `"pending_review"` |
| `"auto"` | All matched jobs are immediately queued for auto-apply with no review |

---

### `POST /api/auto-apply/start`

Enable auto-apply and start the matching process.

- **Auth:** JWT (CurrentUser)
- **Validation:** Must have at least one `target_title` configured

**Response:**
```json
{
  "status": "started",
  "is_active": true,
  "finding_jobs": true
}
```

**Behavior:**
- If the user has **no scored jobs** yet: enqueues a job fetch task and returns `"finding_jobs": true`. Jobs will be found, scored, and matched asynchronously.
- If the user **has scored jobs**: runs matching immediately based on `apply_mode` and returns stats:
```json
{
  "status": "started",
  "is_active": true,
  "finding_jobs": false,
  "matched": 12,
  "queued": 5,
  "pending_review": 7,
  "skipped_already_applied": 3
}
```

**Errors:**
- `400` — No target titles configured

---

### `POST /api/auto-apply/stop`

Disable auto-apply. All pending (`"queued"` and `"pending_review"`) applications are changed to `"skipped"`.

- **Auth:** JWT (CurrentUser)

**Response:**
```json
{
  "status": "stopped",
  "is_active": false,
  "applications_skipped": 7
}
```

---

### `GET /api/auto-apply/queue`

Get the current queue status for the user.

- **Auth:** JWT (CurrentUser)
- **Tip:** Poll this endpoint every ~10 seconds when auto-apply is active

**Response:** [`QueueStatus`](#queuestatus)
```json
{
  "queue_depth": 3,
  "pending_review_count": 5,
  "in_progress_count": 1
}
```

---

### `POST /api/auto-apply/review/{application_id}?action={action}`

Approve or reject an application that is pending review (human-in-the-loop workflow).

- **Auth:** JWT (CurrentUser)
- **Path Params:** `application_id` (UUID)
- **Query Params:** `action` — `"approve"` or `"reject"`
- **Validation:** Application must be in `"pending_review"` status

**On approve:**
```json
{
  "application_id": "uuid",
  "status": "queued"
}
```
The application is pushed to the Redis queue for agent workers to process.

**On reject:**
```json
{
  "application_id": "uuid",
  "status": "skipped"
}
```

**Errors:**
- `400` — Application not in `"pending_review"` status
- `404` — Application not found

---

## 7. Applications — Tracking & Review

### `GET /api/applications`

List the user's applications with optional filters.

- **Auth:** JWT (CurrentUser)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter by application status |
| `date_from` | datetime | — | Start of date range |
| `date_to` | datetime | — | End of date range |
| `page` | integer | `1` | Page number (min 1) |
| `per_page` | integer | `20` | Results per page (1–100) |

**Response:** [`ApplicationListResponse`](#applicationlistresponse)
```json
{
  "applications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "job_id": "uuid",
      "status": "applied",
      "applied_at": "2024-01-15T14:30:00Z",
      "resume_used_url": "https://storage.supabase.co/...",
      "cover_letter_used": "Dear Hiring Manager...",
      "screenshot_url": "https://storage.supabase.co/...",
      "error_message": null,
      "created_at": "2024-01-15T14:00:00Z",
      "current_phase": "completed",
      "phase_message": "Application submitted successfully",
      "generated_application": null,
      "task_mode": "full_auto",
      "job": {
        "id": "uuid",
        "title": "Senior Backend Engineer",
        "company": "Acme Corp",
        "location": "Toronto, ON",
        "url": "https://acme.com/jobs/12345",
        ...
      }
    }
  ],
  "total": 45,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

---

### `GET /api/applications/{application_id}`

Get a single application with full details including the nested job.

- **Auth:** JWT (CurrentUser)
- **Path Params:** `application_id` (UUID)

**Response:** [`ApplicationDetail`](#applicationdetail)

**Errors:**
- `404` — Application not found or doesn't belong to the user

---

### `GET /api/applications/stats`

Get aggregate application statistics for the user.

- **Auth:** JWT (CurrentUser)

**Response:** [`ApplicationStats`](#applicationstats)
```json
{
  "total": 45,
  "applied": 30,
  "pending": 5,
  "failed": 3,
  "skipped": 7,
  "this_week": 12,
  "success_rate": 90.9
}
```

**Note:** `success_rate` = `applied / (applied + failed) * 100`

---

### `POST /api/applications/{application_id}/submit`

Submit reviewed/edited answers for an `extract_only` mode application. This is for applications where the agent extracted form fields and the user reviewed the generated answers before submitting.

- **Auth:** JWT (CurrentUser)
- **Path Params:** `application_id` (UUID)
- **Validation:**
  - Application must be in `"pending_review"` status
  - Application must have `generated_application` data

**Request:**
```json
{
  "answers": {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "years_experience": "8",
    "cover_letter": "Dear Hiring Manager..."
  }
}
```

**Response:**
```json
{
  "application_id": "uuid",
  "status": "queued"
}
```

The application is re-queued with `mode="fill_and_submit"` and the user-provided answers.

---

### Application Lifecycle

```
                 ┌──────────────┐
                 │     new      │  (no Application record — job just exists in feed)
                 └──────┬───────┘
                        │
            ┌───────────┼───────────┐
            │           │           │
            ▼           ▼           ▼
     ┌──────────┐ ┌───────────┐ ┌────────┐
     │  queued   │ │ pending_  │ │ skipped│
     │          │ │  review   │ │        │
     └────┬─────┘ └─────┬─────┘ └────────┘
          │             │                ▲
          │     approve │    reject      │
          │             ├────────────────┘
          │             │
          │     approve │
          │             ▼
          │        ┌──────────┐
          ├───────►│queued    │
          │        └────┬─────┘
          │             │
          ▼             ▼
     ┌────────────────────┐
     │    in_progress      │
     └─────────┬──────────┘
               │
        ┌──────┼──────┐
        │      │      │
        ▼      ▼      ▼
   ┌────────┐ ┌────┐ ┌──────────────┐
   │applied │ │fail│ │needs_review  │
   │        │ │    │ │(extract_only)│
   └────────┘ └────┘ └──────────────┘
```

### Application Progress Phases

While an application is `"in_progress"`, the `current_phase` and `phase_message` fields track real-time progress:

| Phase | Description |
|-------|-------------|
| `"navigating"` | Agent is navigating to the job URL |
| `"extracting"` | Agent is extracting form fields from the page |
| `"answering"` | AI is generating answers for form fields |
| `"filling"` | Agent is filling in the form fields |
| `"submitting"` | Agent is submitting the application |
| `"completed"` | Application submitted successfully |
| `"failed"` | Application failed |

---

### Generated Application Data

When an application uses `extract_only` mode, the `generated_application` field contains the extracted form and generated answers:

```json
{
  "task_id": "uuid",
  "job_url": "https://acme.com/apply/12345",
  "ats_name": "workday",
  "pages_found": 3,
  "created_at": "2024-01-15T14:00:00Z",
  "fields": [
    {
      "name": "first_name",
      "label": "First Name",
      "field_type": "text",
      "options": [],
      "is_required": true,
      "page_number": 1
    },
    {
      "name": "experience_level",
      "label": "Years of Experience",
      "field_type": "select",
      "options": [
        { "value": "0-2", "label": "0-2 years" },
        { "value": "3-5", "label": "3-5 years" },
        { "value": "5+", "label": "5+ years" }
      ],
      "is_required": true,
      "page_number": 1
    }
  ],
  "answers": [
    {
      "field_name": "first_name",
      "value": "Jane",
      "source": "generated"
    },
    {
      "field_name": "experience_level",
      "value": "5+",
      "source": "generated"
    }
  ]
}
```

---

## 8. Admin Dashboard

All admin endpoints require the user to have `role = "admin"`. Returns `403 Forbidden` otherwise.

### `GET /api/admin/overview`

System-wide statistics for the admin dashboard.

- **Auth:** Admin JWT

**Response:** [`AdminOverview`](#adminoverview)
```json
{
  "user_count": 1250,
  "job_count": 50000,
  "active_job_count": 35000,
  "application_counts": {
    "queued": 15,
    "pending_review": 8,
    "in_progress": 3,
    "applied": 2500,
    "failed": 150,
    "skipped": 800,
    "withdrawn": 20
  },
  "total_applications": 3496,
  "queue_depths": {
    "fetch_jobs": 2,
    "score_jobs": 5,
    "apply": 15,
    "enrich": 0
  },
  "ats_distribution": [
    { "name": "workday", "active_job_count": 12000 },
    { "name": "greenhouse", "active_job_count": 8000 },
    { "name": null, "active_job_count": 15000 }
  ]
}
```

---

### `GET /api/admin/users`

List all users with profile summaries.

- **Auth:** Admin JWT

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `per_page` | integer | `50` | Results per page (1–200) |
| `search` | string | — | Search by email (case-insensitive partial match) |

**Response:** [`AdminUserListResponse`](#adminuserlistresponse)
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z",
      "has_profile": true,
      "full_name": "Jane Doe",
      "application_count": 45,
      "applied_count": 30,
      "auto_apply_active": true
    }
  ],
  "total": 1250,
  "page": 1,
  "per_page": 50
}
```

---

### `GET /api/admin/users/{user_id}`

Get single user detail.

- **Auth:** Admin JWT
- **Path Params:** `user_id` (UUID)

**Response:** [`AdminUserSummary`](#adminusersummary)

**Errors:**
- `404` — User not found

---

### `GET /api/admin/queues`

Live queue depths for all background queues.

- **Auth:** Admin JWT

**Response:**
```json
{
  "fetch_jobs_queue_depth": 2,
  "score_jobs_queue_depth": 5,
  "apply_queue_depth": 15,
  "enrich_queue_depth": 0
}
```

---

### `GET /api/admin/workers`

Live worker statuses from Redis heartbeats.

- **Auth:** Admin JWT

**Response:**
```json
{
  "workers": [
    {
      "name": "fetch-worker",
      "worker_id": "fetch-abc123",
      "started_at": "2024-01-15T08:00:00Z",
      "last_beat_at": "2024-01-15T14:30:00Z",
      "tasks_processed": 150,
      "tasks_failed": 2,
      "current_task": "",
      "status": "idle",
      "is_alive": true
    },
    {
      "name": "score-worker",
      "worker_id": "score-def456",
      "started_at": "2024-01-15T08:00:00Z",
      "last_beat_at": "2024-01-15T14:29:55Z",
      "tasks_processed": 500,
      "tasks_failed": 5,
      "current_task": "scoring user abc...",
      "status": "processing",
      "is_alive": true
    }
  ]
}
```

---

### `GET /api/admin/tasks`

Recent task lifecycle events.

- **Auth:** Admin JWT

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter by task status |
| `limit` | integer | `50` | Max results (1–200) |

**Response:** `list[dict]` — task event objects from Redis

---

### `DELETE /api/admin/jobs`

Wipe all jobs. Optional source filter. Soft delete by default.

- **Auth:** Admin JWT

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `hard` | boolean | `false` | Hard delete (permanent) vs soft delete (set `is_active=false`) |
| `source` | string | — | Only wipe jobs from this source |

**Response:**
```json
{
  "affected": 5000,
  "action": "soft_delete"
}
```

---

### Admin Triggers

Manual trigger endpoints to kick off background operations.

#### `POST /api/admin/triggers/fetch`
Enqueue job-fetch tasks for all active users.

#### `POST /api/admin/triggers/fetch/{user_id}`
Enqueue a job-fetch task for a single user.

#### `POST /api/admin/triggers/enrich`
Enqueue un-enriched jobs for LLM enrichment.

#### `POST /api/admin/triggers/rescore`
Enqueue per-user rescoring tasks for all active users.

#### `POST /api/admin/triggers/rematch`
Re-run matching for all active auto-apply users.

**All trigger responses:**
```json
{
  "triggered": "job_fetch",
  "detail": "Enqueued fetch tasks for 15 active users"
}
```

---

### Admin Queue Management

#### `DELETE /api/admin/queues/{queue_name}`

Purge all items from a named queue.

- **Path Params:** `queue_name` — one of `"fetch_jobs"`, `"score_jobs"`, `"enrich"`

**Response:**
```json
{
  "purged": 12,
  "queue": "fetch_jobs"
}
```

---

### Dead-Letter Queues (DLQ)

#### `GET /api/admin/dlq`

Overview of all dead-letter queues.

**Response:**
```json
{
  "queues": {
    "fetch:jobs:dlq": 3,
    "score:jobs:dlq": 0,
    "enrich:jobs:dlq": 1
  },
  "total": 4
}
```

#### `GET /api/admin/dlq/{queue_name}?count={count}`

Peek at items in a DLQ.

- **Query Params:** `count` (integer, default 10, max 100)

**Response:**
```json
{
  "queue_name": "fetch:jobs:dlq",
  "depth": 3,
  "items": [
    {
      "envelope": { "task_id": "uuid", "payload": "..." },
      "error": "Connection timeout to RapidAPI",
      "failed_at": "2024-01-15T14:00:00Z"
    }
  ]
}
```

#### `POST /api/admin/dlq/{queue_name}/replay`

Replay one item from a DLQ back to its original queue.

**Response:**
```json
{
  "replayed": true,
  "queue_name": "fetch:jobs:dlq"
}
```

#### `DELETE /api/admin/dlq/{queue_name}`

Purge all items from a dead-letter queue.

**Response:**
```json
{
  "purged": 3,
  "queue": "fetch:jobs:dlq"
}
```

---

### ATS Platform Registry

#### `GET /api/admin/ats-platforms`

List all ATS platforms with stats and active job counts.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "workday",
    "display_name": "Workday",
    "is_enabled": true,
    "notes": "Supports multi-page forms",
    "success_count": 500,
    "failure_count": 20,
    "last_success_at": "2024-01-15T14:00:00Z",
    "last_failure_at": "2024-01-14T10:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T14:00:00Z",
    "active_job_count": 12000
  }
]
```

#### `PATCH /api/admin/ats-platforms/{name}`

Update an ATS platform (toggle enabled, update notes or display name).

**Request:**
```json
{
  "display_name": "Workday (Enterprise)",
  "is_enabled": true,
  "notes": "Updated notes"
}
```

**Response:** `ATSPlatformResponse`

#### `POST /api/admin/ats-platforms`

Register a new ATS platform.

- **Status:** `201 Created`

**Request:**
```json
{
  "name": "icims",
  "display_name": "iCIMS",
  "is_enabled": false,
  "notes": "Under development"
}
```

**Response:** `ATSPlatformResponse`

**Errors:**
- `409` — Platform already exists

---

## 9. Health Check

### `GET /api/health`

Rich health check verifying DB, Redis, and worker heartbeat status. Always returns HTTP 200 — actual health is conveyed in the `status` field.

- **Auth:** None (public)

**Response:** [`HealthResponse`](#healthresponse)
```json
{
  "status": "ok",
  "version": "1.0.0",
  "db": {
    "status": "ok",
    "latency_ms": 2.3,
    "detail": ""
  },
  "redis": {
    "status": "ok",
    "latency_ms": 1.1,
    "detail": ""
  },
  "workers": [
    { "name": "fetch-worker", "status": "idle", "is_alive": true },
    { "name": "score-worker", "status": "processing", "is_alive": true },
    { "name": "enrich-worker", "status": "offline", "is_alive": false }
  ]
}
```

**Overall status logic:**
- `"ok"` — DB and Redis healthy, at least one worker alive
- `"degraded"` — DB and Redis healthy, but no workers alive
- `"error"` — DB or Redis connection failed

---

## 10. Enums, Statuses & Constants

### ApplicationStatus (enum)

| Value | Description |
|-------|-------------|
| `"queued"` | Waiting in Redis queue for agent worker to pick up |
| `"pending_review"` | Awaiting user approval (safe/hybrid mode) |
| `"in_progress"` | Agent worker is actively processing this application |
| `"applied"` | Successfully submitted |
| `"failed"` | Application attempt failed |
| `"skipped"` | User skipped or auto-apply stopped |
| `"withdrawn"` | User withdrew the application |

### Apply Mode

| Value | Description |
|-------|-------------|
| `"safe"` | All matches go to `pending_review` — user approves each one |
| `"hybrid"` | High-score matches auto-queue; others go to `pending_review` |
| `"auto"` | All matches are immediately queued — no review needed |

### Task Mode

| Value | Description |
|-------|-------------|
| `"full_auto"` | Agent fills and submits the entire application |
| `"extract_only"` | Agent extracts form fields and generates answers, but doesn't submit — user reviews first |
| `"fill_and_submit"` | Agent fills pre-reviewed answers and submits (used after `extract_only` + user review) |

### Location Type

| Value | Display |
|-------|---------|
| `"remote"` | Remote |
| `"hybrid"` | Hybrid |
| `"onsite"` | On-site |

### Experience Level

| Value | Display |
|-------|---------|
| `"entry"` | Entry Level |
| `"mid"` | Mid Level |
| `"senior"` | Senior |
| `"lead"` | Lead |
| `"executive"` | Executive |

### Employment Type

| Value | Display |
|-------|---------|
| `"full_time"` | Full-time |
| `"part_time"` | Part-time |
| `"contract"` | Contract |
| `"internship"` | Internship |

### Application Progress Phases

| Value | Description |
|-------|-------------|
| `"navigating"` | Opening the job application URL |
| `"extracting"` | Reading form fields from the page |
| `"answering"` | AI generating answers |
| `"filling"` | Typing answers into form fields |
| `"submitting"` | Clicking submit |
| `"completed"` | Done |
| `"failed"` | Error occurred |

### Worker Status

| Value | Description |
|-------|-------------|
| `"idle"` | Worker is alive but not processing a task |
| `"processing"` | Worker is actively processing a task |
| `"offline"` | Worker has not sent a heartbeat recently |

### Health Status

| Value | Description |
|-------|-------------|
| `"ok"` | All services healthy |
| `"degraded"` | Core services up but workers down |
| `"error"` | DB or Redis connection failed |

### Skill Proficiency (suggested values)

- `"beginner"`
- `"intermediate"` (default)
- `"advanced"`
- `"expert"`

### Skill Category (suggested values)

- `"technical"` (default)
- `"soft_skills"`
- `"tools"`
- `"languages"`
- `"certifications"`

### Job Source

| Value | Description |
|-------|-------------|
| `"adzuna"` | Adzuna job aggregator API |
| `"ats"` | Crawled from ATS career pages |
| Other | Future sources |

### Salary Currency

Default is `"CAD"`. Other common values: `"USD"`, `"GBP"`, `"EUR"`.

---

## 11. Error Handling

### Error Response Format

All errors return a JSON body:

```json
{
  "detail": "Human-readable error message"
}
```

For validation errors (422):
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (signup, new ATS platform) |
| `204` | No Content (logout) |
| `302` | Redirect (OAuth callback) |
| `400` | Bad Request (validation, business logic error) |
| `401` | Unauthorized (missing/invalid JWT) |
| `403` | Forbidden (insufficient role) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `422` | Unprocessable Entity (Pydantic validation) |
| `500` | Internal Server Error |

### Token Refresh Flow

1. Frontend makes an API call
2. Backend returns `401`
3. Frontend calls `supabase.auth.refreshSession()`
4. If refresh succeeds, retry the original request with new token
5. If refresh fails, redirect to login

---

## 12. Data Type Reference

### UserResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID |
| `email` | string | User email |
| `role` | string | `"user"` or `"admin"` |
| `onboarding_completed` | boolean | Whether onboarding is done |

### TokenResponse

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | Supabase JWT |
| `refresh_token` | string | Refresh token |
| `token_type` | string | Always `"bearer"` |

### ProfileResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Profile ID |
| `user_id` | UUID | User ID |
| `full_name` | string? | Full name |
| `email` | string? | Contact email |
| `phone` | string? | Phone number |
| `location` | string? | Location |
| `linkedin_url` | string? | LinkedIn profile URL |
| `website_url` | string? | Personal website URL |
| `summary` | string? | Professional summary |
| `raw_resume_url` | string? | Supabase Storage URL to uploaded resume |
| `resume_updated_at` | datetime? | When resume was last uploaded |
| `application_preferences` | ApplicationPreferences? | Pre-set screening answers |
| `experiences` | ExperienceResponse[] | Work history |
| `educations` | EducationResponse[] | Education history |
| `skills` | SkillResponse[] | Skills list |

### ProfileUpdate

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | No | Full name |
| `email` | string | No | Contact email |
| `phone` | string | No | Phone number |
| `location` | string | No | Location |
| `linkedin_url` | string | No | LinkedIn URL |
| `website_url` | string | No | Website URL |
| `summary` | string | No | Professional summary |

### ExperienceCreate / ExperienceResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Response only | Experience ID |
| `profile_id` | UUID | Response only | Profile ID |
| `company` | string | **Yes** | Company name |
| `title` | string | **Yes** | Job title |
| `location` | string | No | Work location |
| `start_date` | date | No | Start date (YYYY-MM-DD) |
| `end_date` | date | No | End date (null = current) |
| `description` | string | No | Role description |
| `bullets` | string[] | No | Achievement bullet points (default `[]`) |
| `sort_order` | integer | No | Display order (default `0`) |

### EducationCreate / EducationResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Response only | Education ID |
| `profile_id` | UUID | Response only | Profile ID |
| `institution` | string | **Yes** | School name |
| `degree` | string | No | Degree type |
| `field_of_study` | string | No | Major/field |
| `start_date` | date | No | Start date |
| `end_date` | date | No | End date |
| `gpa` | string | No | GPA |
| `sort_order` | integer | No | Display order (default `0`) |

### SkillCreate / SkillResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Response only | Skill ID |
| `profile_id` | UUID | Response only | Profile ID |
| `name` | string | **Yes** | Skill name |
| `category` | string | No | Category (default `"technical"`) |
| `proficiency` | string | No | Level (default `"intermediate"`) |

### ApplicationPreferences

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `authorized_us` | boolean? | null | Authorized to work in US |
| `authorized_ca` | boolean? | null | Authorized to work in Canada |
| `requires_sponsorship` | boolean? | null | Requires visa sponsorship |
| `willing_to_relocate` | boolean? | null | Willing to relocate |
| `earliest_start_date` | date? | null | Earliest start date |
| `notice_period_days` | integer? | null | Notice period in days |
| `desired_salary_min` | integer? | null | Minimum desired salary |
| `desired_salary_max` | integer? | null | Maximum desired salary |
| `salary_currency` | string | `"USD"` | Currency code |
| `over_18` | boolean? | null | Over 18 years old |
| `has_drivers_license` | boolean? | null | Has driver's license |
| `felony_conviction` | boolean? | null | Felony conviction |
| `how_did_you_hear` | string? | null | Referral source |
| `custom_answers` | dict[string, string] | `{}` | Free-form Q&A pairs |

### ApplicationPreferencesUpdate

Same fields as `ApplicationPreferences` but all are optional. `custom_answers` is merged, not replaced.

### ParsedResume

| Field | Type | Description |
|-------|------|-------------|
| `full_name` | string? | Extracted name |
| `email` | string? | Extracted email |
| `phone` | string? | Extracted phone |
| `location` | string? | Extracted location |
| `linkedin_url` | string? | Extracted LinkedIn |
| `website_url` | string? | Extracted website |
| `summary` | string? | Generated summary |
| `experiences` | ExperienceCreate[] | Parsed work history |
| `educations` | EducationCreate[] | Parsed education |
| `skills` | SkillCreate[] | Parsed skills |
| `raw_text` | string | Full extracted PDF text |

### JobResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Job ID |
| `external_id` | string? | External source ID |
| `title` | string | Job title |
| `company` | string? | Company name |
| `company_logo_url` | string? | Logo URL |
| `location` | string? | Job location |
| `location_type` | string? | `"remote"`, `"hybrid"`, `"onsite"` |
| `salary_min` | number? | Minimum salary |
| `salary_max` | number? | Maximum salary |
| `salary_currency` | string | Currency (default `"CAD"`) |
| `description` | string? | Raw job description |
| `description_clean` | string? | LLM-cleaned description |
| `requirements` | object? | Structured requirements (see below) |
| `experience_level` | string? | Required experience level |
| `employment_type` | string? | Employment type |
| `years_experience_min` | integer? | Min years experience |
| `years_experience_max` | integer? | Max years experience |
| `enriched_at` | datetime? | When LLM enrichment ran |
| `tags` | string[] | Tags |
| `url` | string | Job listing URL |
| `apply_url` | string? | Direct application URL |
| `source` | string | Source (default `"adzuna"`) |
| `category` | string? | Job category |
| `posted_at` | datetime? | When job was posted |
| `is_active` | boolean | Whether job is still active |
| `match_score` | number? | Per-user match score (0–100) |
| `match_factors` | object? | Score breakdown |
| `application_status` | string? | Current application status (null = new) |
| `application_id` | string? | Application UUID if exists |

### Job Requirements Object

When `requirements` is not null, it contains structured data extracted by LLM enrichment:

```json
{
  "required_skills": ["Python", "FastAPI", "PostgreSQL"],
  "preferred_skills": ["Redis", "Docker", "Kubernetes"],
  "education": "BS in Computer Science or equivalent",
  "benefits": ["Health insurance", "401k match", "Remote work"],
  "key_responsibilities": ["Design and build APIs", "Lead team of 3"],
  "visa_sponsorship": false,
  "salary_mentioned": {
    "min": 130000,
    "max": 170000,
    "currency": "USD",
    "type": "annual"
  }
}
```

### Match Factors Object

```json
{
  "combined_method": "llm",
  "model": "claude-haiku-4-5-20251001",
  "matched_skills": ["Python", "FastAPI"],
  "missing_skills": ["Go"],
  "preferred_skills": ["Redis"],
  "reasoning": "Strong match on core backend requirements...",
  "batch_id": "abc123",
  "latency_ms": 850
}
```

### JobListResponse

| Field | Type | Description |
|-------|------|-------------|
| `jobs` | JobResponse[] | List of jobs |
| `total` | integer | Total matching jobs |
| `page` | integer | Current page |
| `per_page` | integer | Results per page |
| `pages` | integer | Total pages |

### ApplicationDetail

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Application ID |
| `user_id` | UUID | User ID |
| `job_id` | UUID? | Job ID |
| `status` | string | Application status enum value |
| `applied_at` | datetime? | When successfully submitted |
| `resume_used_url` | string? | URL to resume used |
| `cover_letter_used` | string? | Cover letter text |
| `screenshot_url` | string? | Screenshot proof URL |
| `error_message` | string? | Error details if failed |
| `created_at` | datetime | When application was created |
| `current_phase` | string? | Current progress phase |
| `phase_message` | string? | Phase-specific message |
| `generated_application` | object? | Extracted form data (see Generated Application Data section) |
| `task_mode` | string? | Task mode used |
| `job` | JobResponse? | Nested job details |

### ApplicationListResponse

| Field | Type | Description |
|-------|------|-------------|
| `applications` | ApplicationDetail[] | List of applications |
| `total` | integer | Total matching |
| `page` | integer | Current page |
| `per_page` | integer | Per page |
| `pages` | integer | Total pages |

### ApplicationStats

| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Total applications |
| `applied` | integer | Successfully applied |
| `pending` | integer | Pending review |
| `failed` | integer | Failed attempts |
| `skipped` | integer | Skipped jobs |
| `this_week` | integer | Applications this week |
| `success_rate` | float | `applied / (applied + failed) * 100` |

### AutoApplyConfigResponse

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | — | Config ID |
| `user_id` | UUID | — | User ID |
| `is_active` | boolean | `false` | Whether auto-apply is running |
| `target_titles` | string[]? | null | Job titles to search for |
| `target_locations` | string[]? | null | Locations to search in |
| `min_salary` | number? | null | Minimum salary filter |
| `max_salary` | number? | null | Maximum salary filter |
| `excluded_companies` | string[]? | null | Companies to exclude |
| `preferred_industries` | string[]? | null | Preferred industries |
| `location_type_pref` | string[]? | null | Location type preferences |
| `employment_type_pref` | string[]? | null | Employment type preferences |
| `experience_level` | string? | null | Target experience level |
| `daily_apply_limit` | integer | `25` | Max daily applications (1–100) |
| `apply_mode` | string | `"safe"` | Apply mode |
| `auto_apply_threshold` | integer | `70` | Score threshold for hybrid mode (15–100) |

### AutoApplyConfigUpdate

Same fields as `AutoApplyConfigResponse` minus `id`, `user_id`, `is_active`. All fields optional.

### QueueStatus

| Field | Type | Description |
|-------|------|-------------|
| `queue_depth` | integer | Tasks in Redis queue |
| `pending_review_count` | integer | Applications awaiting review |
| `in_progress_count` | integer | Applications being processed |

### HealthResponse

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"ok"`, `"degraded"`, `"error"` |
| `version` | string | API version |
| `db` | ServiceCheck? | Database status |
| `redis` | ServiceCheck? | Redis status |
| `workers` | WorkerSummary[] | Worker statuses |

### ServiceCheck

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"ok"` or `"error"` |
| `latency_ms` | float | Connection latency |
| `detail` | string | Error detail if failed |

### WorkerSummary

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Worker name |
| `status` | string | `"idle"`, `"processing"`, `"offline"` |
| `is_alive` | boolean | Whether heartbeat is recent |

### AdminOverview

| Field | Type | Description |
|-------|------|-------------|
| `user_count` | integer | Total users |
| `job_count` | integer | Total jobs |
| `active_job_count` | integer | Active (non-deleted) jobs |
| `application_counts` | dict[string, integer] | Counts by status |
| `total_applications` | integer | Total applications |
| `queue_depths` | QueueDepths | Background queue sizes |
| `ats_distribution` | ATSDistribution[] | Jobs by ATS platform |

### AdminUserSummary

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | User ID |
| `email` | string | Email |
| `role` | string | Role |
| `created_at` | datetime | Registration date |
| `has_profile` | boolean | Has profile |
| `full_name` | string? | Name from profile |
| `application_count` | integer | Total applications |
| `applied_count` | integer | Successfully applied |
| `auto_apply_active` | boolean | Auto-apply enabled |

### AdminUserListResponse

| Field | Type | Description |
|-------|------|-------------|
| `users` | AdminUserSummary[] | User list |
| `total` | integer | Total users |
| `page` | integer | Current page |
| `per_page` | integer | Per page |

### GeneratedApplication

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | string? | Task ID |
| `job_url` | string? | Job application URL |
| `ats_name` | string? | ATS platform name |
| `pages_found` | integer | Number of form pages found |
| `created_at` | datetime? | When generated |
| `fields` | GeneratedApplicationField[] | Extracted form fields |
| `answers` | GeneratedApplicationAnswer[] | Generated answers |

### GeneratedApplicationField

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Field identifier |
| `label` | string | Human-readable label |
| `field_type` | string | `"text"`, `"select"`, `"checkbox"`, `"textarea"`, `"radio"`, `"file"` |
| `options` | object[] | Dropdown/radio options (each with `value` and `label`) |
| `is_required` | boolean | Whether the field is required |
| `page_number` | integer | Which form page this field is on |

### GeneratedApplicationAnswer

| Field | Type | Description |
|-------|------|-------------|
| `field_name` | string | Matches a field's `name` |
| `value` | string | The answer value |
| `source` | string | Where the answer came from (default `"generated"`) |

### SubmitAnswersRequest

| Field | Type | Description |
|-------|------|-------------|
| `answers` | dict[string, string] | `field_name → value` mapping |

---

## Endpoint Summary Table

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/auth/signup` | Public | Create account |
| `POST` | `/api/auth/login` | Public | Sign in |
| `POST` | `/api/auth/oauth/google` | Public | Get Google OAuth URL |
| `GET` | `/api/auth/oauth/callback` | Public | OAuth callback |
| `POST` | `/api/auth/logout` | Bearer | Sign out |
| `GET` | `/api/auth/me` | Bearer | Get current user |
| `POST` | `/api/auth/complete-onboarding` | JWT | Complete onboarding |
| `GET` | `/api/profile` | JWT | Get/create profile |
| `PUT` | `/api/profile` | JWT | Update profile |
| `PUT` | `/api/profile/experiences` | JWT | Replace experiences |
| `PUT` | `/api/profile/education` | JWT | Replace education |
| `PUT` | `/api/profile/skills` | JWT | Replace skills |
| `GET` | `/api/profile/preferences` | JWT | Get preferences |
| `PUT` | `/api/profile/preferences` | JWT | Update preferences |
| `POST` | `/api/profile/resume/upload` | JWT | Upload resume PDF |
| `POST` | `/api/profile/resume/parse` | JWT | Parse resume with AI |
| `GET` | `/api/profile/resume/parsed` | JWT | Get parsed resume |
| `GET` | `/api/jobs` | JWT | List scored jobs |
| `GET` | `/api/jobs/{job_id}` | JWT | Get job detail |
| `GET` | `/api/jobs/{job_id}/match` | JWT | Get match breakdown |
| `POST` | `/api/jobs/rescore` | JWT | Trigger rescore |
| `POST` | `/api/jobs/{job_id}/queue` | JWT | Queue job for apply |
| `POST` | `/api/jobs/{job_id}/skip` | JWT | Skip a job |
| `POST` | `/api/jobs/{job_id}/unskip` | JWT | Undo skip |
| `GET` | `/api/auto-apply/config` | JWT | Get auto-apply config |
| `PUT` | `/api/auto-apply/config` | JWT | Update config |
| `POST` | `/api/auto-apply/start` | JWT | Start auto-apply |
| `POST` | `/api/auto-apply/stop` | JWT | Stop auto-apply |
| `GET` | `/api/auto-apply/queue` | JWT | Get queue status |
| `POST` | `/api/auto-apply/review/{id}` | JWT | Approve/reject review |
| `GET` | `/api/applications` | JWT | List applications |
| `GET` | `/api/applications/stats` | JWT | Application stats |
| `GET` | `/api/applications/{id}` | JWT | Get application |
| `POST` | `/api/applications/{id}/submit` | JWT | Submit reviewed answers |
| `GET` | `/api/admin/overview` | Admin | System overview |
| `GET` | `/api/admin/users` | Admin | List users |
| `GET` | `/api/admin/users/{id}` | Admin | Get user |
| `GET` | `/api/admin/queues` | Admin | Queue depths |
| `GET` | `/api/admin/workers` | Admin | Worker statuses |
| `GET` | `/api/admin/tasks` | Admin | Recent tasks |
| `DELETE` | `/api/admin/jobs` | Admin | Wipe jobs |
| `POST` | `/api/admin/triggers/fetch` | Admin | Trigger fetch |
| `POST` | `/api/admin/triggers/fetch/{id}` | Admin | Trigger user fetch |
| `POST` | `/api/admin/triggers/enrich` | Admin | Trigger enrichment |
| `POST` | `/api/admin/triggers/rescore` | Admin | Trigger rescore |
| `POST` | `/api/admin/triggers/rematch` | Admin | Trigger rematch |
| `DELETE` | `/api/admin/queues/{name}` | Admin | Purge queue |
| `GET` | `/api/admin/dlq` | Admin | DLQ overview |
| `GET` | `/api/admin/dlq/{name}` | Admin | DLQ items |
| `POST` | `/api/admin/dlq/{name}/replay` | Admin | Replay DLQ item |
| `DELETE` | `/api/admin/dlq/{name}` | Admin | Purge DLQ |
| `GET` | `/api/admin/ats-platforms` | Admin | List ATS platforms |
| `PATCH` | `/api/admin/ats-platforms/{name}` | Admin | Update ATS platform |
| `POST` | `/api/admin/ats-platforms` | Admin | Create ATS platform |

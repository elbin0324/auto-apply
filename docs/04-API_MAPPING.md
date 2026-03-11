# ApplyPilot API Mapping

> Maps every UI element to the exact API endpoint, request params, and response fields. Identifies gaps where the current backend doesn't support what the UI needs.

---

## Status Legend

- ✅ **Covered** — existing endpoint provides what's needed
- ⚠️ **Partial** — endpoint exists but response needs extension
- ❌ **Gap** — no endpoint exists, needs to be created

---

## 1. Dashboard

| UI Element | Endpoint | Fields Used | Status |
|-----------|----------|-------------|--------|
| Deployed count | `GET /api/applications/stats` | `total` | ✅ |
| Interviews count | `GET /api/applications/stats` | `applied` | ✅ |
| Response rate | `GET /api/applications/stats` | `success_rate` | ✅ |
| Avg match score | `GET /api/jobs?per_page=1` | Need to compute average | ⚠️ No avg in response |
| Pipeline QUEUED count | `GET /api/auto-apply/queue` | `queue_depth` | ✅ |
| Pipeline IN-FLIGHT count | `GET /api/auto-apply/queue` | `in_progress_count` | ✅ |
| Pipeline LANDED count | `GET /api/applications/stats` | `applied` | ✅ |
| Pipeline NO-GO count | `GET /api/applications/stats` | `failed` | ✅ |
| Recent job rows | `GET /api/applications?per_page=5` | `applications[].job.*`, `applications[].status` | ✅ |
| Activity feed | — | — | ❌ No activity/event endpoint |
| ATS coverage breakdown | — | — | ❌ No user-level ATS stats |
| Weekly chart data | — | — | ❌ No weekly breakdown |

### Dashboard Gaps

**Recommended: Create `GET /api/dashboard/summary`**

Combined endpoint that returns everything the dashboard needs in one call:
```json
{
  "stats": { "total": 68, "applied": 42, "pending": 10, "failed": 4, "this_week": 14, "success_rate": 87.5 },
  "queue": { "queue_depth": 2, "pending_review_count": 2, "in_progress_count": 1 },
  "avg_match_score": 84.2,
  "recent_applications": [ /* last 5-8 ApplicationDetail with nested job */ ],
  "ats_breakdown": [ { "ats_name": "greenhouse", "count": 34, "success_rate": 88 }, ... ],
  "weekly_applications": [ { "week_start": "2026-03-03", "applied": 14, "interviews": 4 }, ... ],
  "recent_activity": [ { "type": "status_change", "job_title": "...", "company": "...", "new_status": "applied", "timestamp": "..." }, ... ]
}
```

This avoids 4-5 separate API calls on dashboard load.

---

## 2. Job Radar

| UI Element | Endpoint | Fields Used | Status |
|-----------|----------|-------------|--------|
| Job list (new only) | `GET /api/jobs?status=new` | All JobResponse fields | ✅ |
| Search | `GET /api/jobs?query={text}` | `query` param | ✅ |
| Location filter | `GET /api/jobs?location_type=remote` | `location_type` param | ✅ |
| Experience filter | `GET /api/jobs?experience_level=senior` | `experience_level` param | ✅ |
| Sort by match | `GET /api/jobs?sort_by=match_score` | `sort_by` param | ✅ |
| Match score display | Response `match_score` field | `match_score` (0-100) | ✅ |
| Match tier label | Computed client-side from score | — | ✅ (client logic) |
| Apply action | `POST /api/jobs/{id}/queue` | — | ✅ |
| Skip action | `POST /api/jobs/{id}/skip` | — | ✅ |
| Job tags | Response `tags[]` | — | ✅ |
| Pagination | `page` + `per_page` params | `total`, `pages` in response | ✅ |

### Job Detail (SidePanel)

| UI Element | Endpoint | Fields Used | Status |
|-----------|----------|-------------|--------|
| Basic info | `GET /api/jobs/{id}` | title, company, location, salary, etc. | ✅ |
| Match score | `GET /api/jobs/{id}` | `match_score` | ✅ |
| Match factors | `GET /api/jobs/{id}/match` | `factors.matched_skills`, `missing_skills`, `reasoning` | ✅ |
| Structured strengths | `GET /api/jobs/{id}/match` | — | ⚠️ Need structured format |
| Structured concerns | `GET /api/jobs/{id}/match` | — | ⚠️ Need structured format |
| Key matches list | `GET /api/jobs/{id}/match` | `factors.matched_skills` | ⚠️ Partial |
| Key gaps list | `GET /api/jobs/{id}/match` | `factors.missing_skills` | ⚠️ Partial |
| Summary paragraph | `GET /api/jobs/{id}` | `description_clean` | ⚠️ Need concise summary |
| Work type / job type / level | `GET /api/jobs/{id}` | `location_type`, `employment_type`, `experience_level` | ✅ |

### SidePanel Match Analysis Gap

**Recommended: Extend `GET /api/jobs/{id}/match` response:**

The LLM scoring pipeline generates `reasoning` text. Extend the response to include structured analysis:

```json
{
  "job_id": "uuid",
  "score": 87.5,
  "label": "Strong match",
  "summary": "Build payment infrastructure products serving millions of businesses.",
  "strengths": [
    "Your full stack React+Node experience directly matches the requirements",
    "Production ML pipeline experience demonstrates systems thinking"
  ],
  "concerns": [
    "No direct payments domain experience, though transferable"
  ],
  "key_matches": ["React + Node.js", "Production systems", "Product engineering"],
  "key_gaps": ["Payments domain", "Ruby/Go"],
  "factors": { /* existing factors object */ }
}
```

This may require modifying the LLM scoring prompt to output structured JSON with these fields, or post-processing the existing `reasoning` field.

---

## 3. Flight Queue

| UI Element | Endpoint | Fields Used | Status |
|-----------|----------|-------------|--------|
| Tab counts | `GET /api/applications/stats` | `applied`, `pending`, `failed`, `skipped` | ⚠️ Missing queued/in_progress split |
| Tab counts (queue) | `GET /api/auto-apply/queue` | `queue_depth`, `pending_review_count`, `in_progress_count` | ✅ |
| Application list by status | `GET /api/applications?status={status}` | All ApplicationDetail fields | ✅ |
| In-flight progress phase | `GET /api/applications/{id}` | `current_phase`, `phase_message` | ✅ |
| Approve single | `POST /api/auto-apply/review/{id}?action=approve` | — | ✅ |
| Reject single | `POST /api/auto-apply/review/{id}?action=reject` | — | ✅ |
| Batch approve | Multiple `POST /api/auto-apply/review/{id}?action=approve` | — | ✅ (sequential) |
| Preview answers | `GET /api/applications/{id}` | `generated_application.fields`, `.answers` | ✅ |
| Submit edited answers | `POST /api/applications/{id}/submit` | `answers` dict | ✅ |

### Queue Gaps

**Tab count derivation:** The stats endpoint returns `pending` (which is `pending_review`) and `applied` but doesn't split `queued` from `in_progress`. Use:
- `queue_depth` from `/api/auto-apply/queue` for QUEUED tab
- `in_progress_count` for IN-FLIGHT tab
- `pending_review_count` for REVIEW tab
- `applied` from stats for LANDED
- `failed` from stats for FAILED

This requires 2 API calls. **Consider adding a combined queue-focused stats endpoint.**

**Batch operations:** No batch approve endpoint exists. The frontend must call `/api/auto-apply/review/{id}` sequentially for each selected item. Consider adding `POST /api/auto-apply/review/batch` accepting `{ application_ids: [], action: "approve" }`.

**Live progress polling:** For in-flight items, poll `GET /api/applications/{id}` every 3-5 seconds. Consider WebSocket/SSE for push updates.

---

## 4. Profile / Resume Hangar

| UI Element | Endpoint | Status |
|-----------|----------|--------|
| Load profile | `GET /api/profile` | ✅ |
| Update contact | `PUT /api/profile` | ✅ |
| Upload resume | `POST /api/profile/resume/upload` | ✅ |
| Parse resume | `POST /api/profile/resume/parse` | ✅ |
| Get parsed data | `GET /api/profile/resume/parsed` | ✅ |
| Update experiences | `PUT /api/profile/experiences` | ✅ |
| Update education | `PUT /api/profile/education` | ✅ |
| Update skills | `PUT /api/profile/skills` | ✅ |

**No gaps.** This is fully covered.

---

## 5. Autopilot Config

| UI Element | Endpoint | Status |
|-----------|----------|--------|
| Load config | `GET /api/auto-apply/config` | ✅ |
| Update config | `PUT /api/auto-apply/config` | ✅ |
| Start autopilot | `POST /api/auto-apply/start` | ✅ |
| Stop autopilot | `POST /api/auto-apply/stop` | ✅ |
| Queue status | `GET /api/auto-apply/queue` | ✅ |
| Today's apply count | — | ⚠️ Need `this_week` or `today` count |

### Minor Gap
"Today's applies: 7/25" shown in the engage card. `GET /api/applications/stats` has `this_week` but not `today`. Either derive from applications list filtered by today's date, or add `today` to the stats response.

---

## 6. Flight Tracker

| UI Element | Endpoint | Status |
|-----------|----------|--------|
| Stats row | `GET /api/applications/stats` | ✅ |
| Application table | `GET /api/applications?per_page=20` | ✅ |
| Pagination | `page`, `per_page` params | ✅ |
| Status filter | `status` param | ✅ |
| Date filter | `date_from`, `date_to` params | ✅ |
| Row click → detail | `GET /api/applications/{id}` | ✅ |

**No gaps.**

---

## 7. Systems Status Bar

| UI Element | Endpoint | Status |
|-----------|----------|--------|
| RES-ENG (Resume Engine) | `GET /api/health` → workers | ⚠️ |
| ATS-NAV (ATS Navigator) | `GET /api/health` → workers | ⚠️ |
| JOB-RDR (Job Radar) | `GET /api/health` → workers | ⚠️ |
| CVR-LTR (Cover Letter) | — | ⚠️ |
| STEALTH (Stealth Systems) | — | ⚠️ |

### Gap
`GET /api/health` is public and returns worker statuses, but the workers are named `fetch-worker`, `score-worker`, `enrich-worker` — not matching the UI's subsystem names. 

**Options:**
1. Map worker names to UI subsystem names client-side:
   - `fetch-worker` → JOB-RDR
   - `score-worker` → RES-ENG (scoring uses resume data)
   - `enrich-worker` → ATS-NAV
   - No direct mapping for CVR-LTR or STEALTH
2. Create `GET /api/status` endpoint with UI-friendly subsystem names
3. Treat the status bar as decorative and derive from health status: if `health.status === "ok"` → all LEDs green, if `"degraded"` → some amber

Recommend option 3 for MVP, option 2 for production.

---

## 8. Authentication & Onboarding

| UI Element | Endpoint | Status |
|-----------|----------|--------|
| Signup | `POST /api/auth/signup` | ✅ |
| Login | `POST /api/auth/login` | ✅ |
| Google OAuth | `POST /api/auth/oauth/google` → redirect | ✅ |
| Current user | `GET /api/auth/me` | ✅ |
| Onboarding gate | `GET /api/auth/me` → `onboarding_completed` | ✅ |
| Complete onboarding | `POST /api/auth/complete-onboarding` | ✅ |
| Logout | `POST /api/auth/logout` | ✅ |

**No gaps.**

---

## Summary of Backend Work Needed

### Must Have (MVP)
1. **Extend match endpoint** — structured strengths/concerns/key_matches/key_gaps in `GET /api/jobs/{id}/match`
2. **Batch review endpoint** — `POST /api/auto-apply/review/batch` for approving/rejecting multiple

### Should Have (Pre-launch)
3. **Dashboard summary endpoint** — `GET /api/dashboard/summary` to avoid 4-5 calls
4. **Today's apply count** — add `today` field to `GET /api/applications/stats`
5. **ATS breakdown** — user-level ATS stats for dashboard and analytics

### Nice to Have (Post-launch)
6. **Activity feed endpoint** — `GET /api/activity` with timestamped events
7. **Weekly breakdown** — `GET /api/applications/weekly` for charts
8. **Status push** — WebSocket/SSE for live in-flight progress updates
9. **UI-friendly health** — `GET /api/status` with subsystem names matching the UI

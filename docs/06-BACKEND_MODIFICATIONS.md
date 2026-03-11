# ApplyPilot Backend Modifications

> Specific backend API changes required to support the new UI. Organized by priority.

---

## Priority 1: Must Have (Before Frontend Build)

### 1.1 Extend Match Breakdown Response

**Endpoint:** `GET /api/jobs/{job_id}/match`

**Current response:**
```json
{
  "job_id": "uuid",
  "score": 87.5,
  "factors": {
    "combined_method": "llm",
    "matched_skills": ["Python", "FastAPI"],
    "missing_skills": ["Go"],
    "preferred_skills": ["Redis"],
    "reasoning": "Strong match on core requirements..."
  }
}
```

**Required response:**
```json
{
  "job_id": "uuid",
  "score": 87.5,
  "label": "Strong match",
  "summary": "Build payment infrastructure products serving millions of businesses.",
  "strengths": [
    "Your full stack React+Node experience directly matches the requirements",
    "Production ML pipeline experience demonstrates systems thinking",
    "Co-founding Cactus demonstrates product ownership"
  ],
  "concerns": [
    "No direct payments domain experience, though skills are transferable"
  ],
  "key_matches": [
    "React + Node.js full stack",
    "Production systems at scale",
    "Product engineering mindset",
    "Co-founder experience"
  ],
  "key_gaps": [
    "Payments domain knowledge",
    "Ruby/Go (Stripe stack)"
  ],
  "factors": { /* existing factors, unchanged */ }
}
```

**Implementation approach:**
- The LLM scoring pipeline already generates a `reasoning` field — modify the scoring prompt to output structured JSON with `strengths[]`, `concerns[]`, `key_matches[]`, `key_gaps[]`, and `summary`
- Add `label` computation server-side: map score ranges to labels (90+ "Exceptional match", 75+ "Strong match", etc.)
- The `summary` can come from the job's `description_clean` field, passed through a one-line summarization, or just use the first 1-2 sentences
- Store the structured analysis alongside the existing `match_factors` in the `JobMatchScore` table (add a `structured_analysis` JSONB column, or extend the existing `factors` JSON)

**Scoring prompt addition:**
```
In addition to the score, provide:
- summary: 1-2 sentence plain English summary of what the role involves
- strengths: 2-4 specific reasons this is a good match, referencing the candidate's actual experience
- concerns: 0-2 notable gaps or risks, be honest but constructive
- key_matches: top 4-7 qualifications the candidate has that the job values
- key_gaps: top 3-5 qualifications the job requires that the candidate lacks

Write strengths and concerns in second person ("your experience with...").
```

### 1.2 Batch Review Endpoint

**New endpoint:** `POST /api/auto-apply/review/batch`

**Request:**
```json
{
  "application_ids": ["uuid1", "uuid2", "uuid3"],
  "action": "approve"
}
```

**Response:**
```json
{
  "processed": 3,
  "results": [
    { "application_id": "uuid1", "status": "queued" },
    { "application_id": "uuid2", "status": "queued" },
    { "application_id": "uuid3", "status": "queued" }
  ],
  "errors": []
}
```

**Implementation:** Loop through IDs, call the same logic as single review. Return partial success if some fail (e.g., already processed). Transaction-safe — either all succeed or return clear errors per item.

---

## Priority 2: Should Have (Before Launch)

### 2.1 Dashboard Summary Endpoint

**New endpoint:** `GET /api/dashboard/summary`

**Response:**
```json
{
  "stats": {
    "total": 68,
    "applied": 42,
    "pending_review": 10,
    "queued": 5,
    "in_progress": 1,
    "failed": 4,
    "skipped": 6,
    "this_week": 14,
    "today": 7,
    "success_rate": 87.5,
    "avg_match_score": 84.2
  },
  "queue": {
    "queue_depth": 2,
    "pending_review_count": 2,
    "in_progress_count": 1
  },
  "recent_applications": [
    /* Last 5-8 ApplicationDetail objects with nested job */
  ],
  "ats_breakdown": [
    { "ats_name": "greenhouse", "display_name": "Greenhouse", "application_count": 34, "success_rate": 88.2 },
    { "ats_name": "lever", "display_name": "Lever", "application_count": 18, "success_rate": 83.3 }
  ]
}
```

**Implementation:**
- Combines queries from `/applications/stats`, `/auto-apply/queue`, and new aggregation queries
- `avg_match_score`: `SELECT AVG(score) FROM job_match_scores WHERE user_id = ?`
- `ats_breakdown`: Join applications → jobs, group by job.source/ats_platform, compute count + success rate
- `today` count: filter applications by `created_at >= today's midnight`
- Cache for 30 seconds to avoid expensive queries on every dashboard load

### 2.2 Extend Application Stats

**Endpoint:** `GET /api/applications/stats`

**Add fields:**
```json
{
  "total": 68,
  "applied": 42,
  "pending": 10,
  "queued": 5,
  "in_progress": 1,
  "failed": 4,
  "skipped": 6,
  "this_week": 14,
  "today": 7,
  "success_rate": 87.5
}
```

Currently missing `queued`, `in_progress`, and `today`. These are derivable from the DB — just add the queries.

### 2.3 Application Status Multi-Filter

**Endpoint:** `GET /api/applications`

**Change:** Allow `status` param to accept comma-separated values or repeated params:
```
GET /api/applications?status=queued,in_progress
# or
GET /api/applications?status=queued&status=in_progress
```

Currently only supports single status. The Flight Queue tabs need to fetch by specific status, which works, but a combined "active" view might be useful.

---

## Priority 3: Nice to Have (Post-Launch)

### 3.1 Activity Feed

**New endpoint:** `GET /api/activity?limit=20`

Returns timestamped events for the user's recent activity:
```json
{
  "events": [
    {
      "id": "uuid",
      "type": "application_status_change",
      "title": "Moved to Interview",
      "description": "Stripe — Senior Product Engineer",
      "status": "applied",
      "timestamp": "2026-03-10T14:30:00Z",
      "job_id": "uuid",
      "application_id": "uuid"
    },
    {
      "type": "resume_parsed",
      "title": "Resume parsed",
      "description": "Profile updated with 3 experiences, 12 skills",
      "timestamp": "2026-03-08T10:00:00Z"
    },
    {
      "type": "jobs_found",
      "title": "New matches found",
      "description": "24 jobs matched — 8 high-confidence queued",
      "timestamp": "2026-03-10T06:00:00Z"
    }
  ]
}
```

**Implementation:** Create an `activity_events` table that records status changes, system events, and user actions. Or, derive events from application status history (add a `status_history` JSONB column to applications that logs each transition with timestamp).

### 3.2 Weekly Application Breakdown

**New endpoint:** `GET /api/applications/weekly?weeks=8`

```json
{
  "weeks": [
    { "week_start": "2026-01-20", "applications": 12, "applied": 10, "interviews": 2 },
    { "week_start": "2026-01-27", "applications": 18, "applied": 15, "interviews": 3 }
  ]
}
```

### 3.3 WebSocket/SSE for Live Progress

**New endpoint:** `WS /api/ws/applications` or `GET /api/applications/stream` (SSE)

Pushes real-time updates when application status or phase changes:
```json
{
  "type": "phase_update",
  "application_id": "uuid",
  "current_phase": "filling",
  "phase_message": "Filling form page 3 of 5",
  "timestamp": "2026-03-10T14:35:00Z"
}
```

This replaces the need to poll individual applications every 3-5 seconds.

### 3.4 UI-Friendly Health Status

**New endpoint:** `GET /api/status` (public, lightweight)

```json
{
  "overall": "ok",
  "subsystems": {
    "resume_engine": { "status": "ok", "label": "RES-ENG" },
    "ats_navigator": { "status": "ok", "label": "ATS-NAV" },
    "job_radar": { "status": "ok", "label": "JOB-RDR" },
    "cover_letter": { "status": "generating", "label": "CVR-LTR" },
    "stealth": { "status": "ok", "label": "STEALTH" }
  }
}
```

Maps backend worker health to the UI's subsystem model. For MVP, derive from `GET /api/health` client-side.

---

## Migration Notes

### Database Changes
1. Extend `job_match_scores` table: add `structured_analysis JSONB` column (or extend existing `factors` JSON)
2. Optionally add `activity_events` table for activity feed
3. Optionally add `status_history JSONB` column to `applications` table

### Scoring Pipeline Changes
1. Modify LLM scoring prompt to output structured analysis
2. Parse and store the structured output alongside the score
3. Backfill existing scores (run a one-time migration that re-generates structured analysis for existing match records, or accept that old matches won't have it and handle gracefully client-side)

### Backwards Compatibility
All changes are additive — new fields added to existing responses, new endpoints added. No existing endpoint contracts change. The frontend should handle missing fields gracefully (e.g., if `strengths` is null, don't render the fit analysis section).

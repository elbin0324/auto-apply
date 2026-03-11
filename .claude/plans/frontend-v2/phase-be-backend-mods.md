# Phase BE: Backend Modifications

> **Depends on:** Nothing (can run immediately)
> **Blocks:** Full functionality of Phases 3 (dashboard), 4 (job detail), 5 (batch review)
> **Parallelizable with:** All frontend phases (0-10)

---

## Goal

Implement backend API changes required by the new frontend, as defined in `docs/06-BACKEND_MODIFICATIONS.md`. Organized by priority — MVP items first.

---

## Priority 1: Must Have (Before Frontend Integration)

### BE.1 Extend Match Breakdown Response

**Endpoint:** `GET /api/jobs/{job_id}/match`

**Current response:** Only has `score`, `factors` (with raw `reasoning` text).

**Required additions:**
```json
{
  "score": 87.5,
  "label": "Strong match",           // NEW
  "summary": "Build payment infrastructure...", // NEW
  "strengths": [                      // NEW
    "Your full stack React+Node experience directly matches..."
  ],
  "concerns": [                       // NEW
    "No direct payments domain experience..."
  ],
  "key_matches": ["React + Node.js", "Production systems"], // NEW
  "key_gaps": ["Payments domain", "Ruby/Go"],               // NEW
  "factors": { /* existing, unchanged */ }
}
```

**Implementation steps:**
1. Add `structured_analysis JSONB` column to `job_match_scores` table (Alembic migration)
2. Modify LLM scoring prompt in `backend/workers/services/` to output structured JSON:
   - `summary` (1-2 sentences about the role)
   - `strengths` (2-4 specific reasons, second person)
   - `concerns` (0-2 gaps, constructive)
   - `key_matches` (4-7 qualifications matched)
   - `key_gaps` (3-5 qualifications missing)
3. Add `label` computation server-side: `score >= 90 → "Exceptional match"`, `>= 75 → "Strong match"`, etc.
4. Update `GET /api/jobs/{id}/match` response schema to include new fields
5. Store structured analysis in new column alongside existing `factors`
6. Handle gracefully when `structured_analysis` is null (old scores): return null for new fields

**Files to modify:**
- `backend/db/` — new Alembic migration
- `backend/models/` — add column to JobMatchScore model
- `backend/workers/services/` — modify scoring prompt
- `backend/schemas/` — extend match response schema
- `backend/routers/jobs.py` — update match endpoint to return new fields
- `backend/tests/` — update tests

### BE.2 Batch Review Endpoint

**New endpoint:** `POST /api/auto-apply/review/batch`

**Request:**
```json
{
  "application_ids": ["uuid1", "uuid2"],
  "action": "approve"
}
```

**Response:**
```json
{
  "processed": 2,
  "results": [
    { "application_id": "uuid1", "status": "queued" },
    { "application_id": "uuid2", "status": "queued" }
  ],
  "errors": []
}
```

**Implementation steps:**
1. Add Pydantic schemas: `BatchReviewRequest`, `BatchReviewResponse`
2. Add endpoint to `backend/routers/auto_apply.py`
3. Loop through IDs, apply same logic as single review
4. Handle partial failures (some already processed, etc.)
5. Return clear per-item results
6. Add tests

**Files to modify:**
- `backend/schemas/` — new schemas
- `backend/routers/auto_apply.py` — new endpoint
- `backend/services/auto_apply_service.py` — batch logic (or reuse single)
- `backend/tests/` — new tests

---

## Priority 2: Should Have (Before Launch)

### BE.3 Dashboard Summary Endpoint

**New endpoint:** `GET /api/dashboard/summary`

**Response:**
```json
{
  "stats": {
    "total": 68, "applied": 42, "pending_review": 10,
    "queued": 5, "in_progress": 1, "failed": 4, "skipped": 6,
    "this_week": 14, "today": 7, "success_rate": 87.5,
    "avg_match_score": 84.2
  },
  "queue": {
    "queue_depth": 2, "pending_review_count": 2, "in_progress_count": 1
  },
  "recent_applications": [ /* last 5-8 ApplicationDetail with nested job */ ],
  "ats_breakdown": [
    { "ats_name": "greenhouse", "display_name": "Greenhouse", "application_count": 34, "success_rate": 88.2 }
  ]
}
```

**Implementation steps:**
1. Add new router: `backend/routers/dashboard.py`
2. Add Pydantic schemas for response
3. Combine queries:
   - Application stats (existing service)
   - Queue status (existing service)
   - `SELECT AVG(score) FROM job_match_scores WHERE user_id = ?`
   - Recent applications with joined jobs
   - ATS breakdown: join applications → jobs, group by ATS platform
   - Today count: filter by `created_at >= today midnight`
4. Cache for 30 seconds (simple in-memory or Redis)
5. Mount router in `main.py`
6. Add tests

### BE.4 Extend Application Stats

**Endpoint:** `GET /api/applications/stats`

**Add fields:** `queued`, `in_progress`, `today`

**Implementation:** Add DB queries for:
- `SELECT COUNT(*) FROM applications WHERE user_id = ? AND status = 'queued'`
- `SELECT COUNT(*) FROM applications WHERE user_id = ? AND status = 'in_progress'`
- `SELECT COUNT(*) FROM applications WHERE user_id = ? AND DATE(created_at) = CURRENT_DATE`

Update the `ApplicationStats` Pydantic schema and service.

### BE.5 Application Status Multi-Filter

**Endpoint:** `GET /api/applications`

Allow comma-separated status values:
```
GET /api/applications?status=queued,in_progress
```

**Implementation:** Parse `status` param as comma-separated list, use `IN` clause in query.

---

## Priority 3: Nice to Have (Post-Launch)

### BE.6 Activity Feed Endpoint

**New endpoint:** `GET /api/activity?limit=20`

Returns timestamped events derived from application status changes.

**Implementation options:**
- A: Add `status_history JSONB` column to applications table (log transitions)
- B: Create `activity_events` table
- C: Derive from applications list (query recent, format as events)

Recommend option C for MVP (no DB changes), option A for production.

### BE.7 Weekly Breakdown

**New endpoint:** `GET /api/applications/weekly?weeks=8`

Group applications by week, return counts.

### BE.8 UI-Friendly Health Status

**New endpoint:** `GET /api/status`

Map worker names to UI subsystem names.

---

## Testing

All changes should include tests:
- Unit tests for new service methods
- Integration tests for new endpoints
- Verify backward compatibility (existing endpoint contracts unchanged)

**Run:** `cd backend && poetry run pytest tests/ -x -v`

---

## Migration Checklist

- [ ] `structured_analysis JSONB` column added to `job_match_scores`
- [ ] Alembic migration created and applied
- [ ] Scoring prompt updated to output structured analysis
- [ ] Match endpoint returns new fields
- [ ] Batch review endpoint created
- [ ] Dashboard summary endpoint created
- [ ] Application stats extended with queued/in_progress/today
- [ ] All tests pass
- [ ] Backward compatible (old clients still work)

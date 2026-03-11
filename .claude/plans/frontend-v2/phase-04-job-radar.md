# Phase 4: Job Radar

> **Depends on:** Phase 1 (app shell), Phase 2 (shared components)
> **Blocks:** Nothing (independent page)
> **Parallelizable with:** Phases 3, 5-9

---

## Goal

Build the Job Radar page for browsing, searching, filtering, and acting on new (unprocessed) jobs. Includes SidePanel integration with match analysis.

---

## API Endpoints Used

| Action | Endpoint | Notes |
|--------|----------|-------|
| List new jobs | `GET /api/jobs?status=new&sort_by=match_score&per_page=20` | Ready |
| Search | `GET /api/jobs?query={text}` | Ready |
| Filter by location type | `GET /api/jobs?location_type=remote` | Ready |
| Filter by experience | `GET /api/jobs?experience_level=senior` | Ready |
| Sort | `GET /api/jobs?sort_by=match_score` | Ready |
| Pagination | `page` + `per_page` params | Ready |
| Job detail | `GET /api/jobs/{id}` | Ready |
| Match analysis | `GET /api/jobs/{id}/match` | Ready (structured analysis from Phase BE) |
| Apply | `POST /api/jobs/{id}/queue` | Ready |
| Skip | `POST /api/jobs/{id}/skip` | Ready |

---

## Steps

### 4.1 Jobs Data Hook

**File:** `frontend/src-v2/hooks/use-jobs.ts`

```tsx
interface UseJobsParams {
  query?: string;
  location_type?: string[];
  experience_level?: string[];
  employment_type?: string[];
  sort_by?: string;
  page?: number;
  per_page?: number;
}

export function useJobs(params: UseJobsParams) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => api.get('/api/jobs', { params: { status: 'new', ...params } }),
  });
}
```

### 4.2 Job Actions Hook

**File:** `frontend/src-v2/hooks/use-job-actions.ts`

```tsx
export function useJobActions() {
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => api.post(`/api/jobs/${jobId}/queue`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-status'] });
    },
  });

  const skipMutation = useMutation({
    mutationFn: (jobId: string) => api.post(`/api/jobs/${jobId}/skip`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return { apply: applyMutation, skip: skipMutation };
}
```

### 4.3 Job Detail Hook

**File:** `frontend/src-v2/hooks/use-job-detail.ts`

```tsx
export function useJobDetail(jobId: string | null) {
  const job = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get(`/api/jobs/${jobId}`),
    enabled: !!jobId,
  });

  const match = useQuery({
    queryKey: ['job-match', jobId],
    queryFn: () => api.get(`/api/jobs/${jobId}/match`),
    enabled: !!jobId,
  });

  return { job, match };
}
```

### 4.4 Search/Filter Card

**File:** `frontend/src-v2/components/jobs/job-filters.tsx`

**Layout:**
```
Card with CardHeader "JOB RADAR"
├── Search Input (full width, Search icon, debounced 300ms)
├── Filter Row (flex, gap)
│   ├── Location Type Select (All / Remote / Hybrid / On-site)
│   ├── Experience Level Select (All / Entry / Mid / Senior / Lead)
│   └── Sort By Select (Match ↓ / Salary ↓ / Date ↓)
```

**State:** Managed with URL search params or local state that feeds into `useJobs` hook.
**Debounce:** Search input debounced 300ms before triggering refetch.

### 4.5 Job Card Component

**File:** `frontend/src-v2/components/jobs/job-card.tsx`

Expanded card view for each unprocessed job (different from JRow — has tags and action buttons):

```tsx
interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
  onSkip: (jobId: string) => void;
  onClick: (job: Job) => void;
}
```

**Grid layout:** `48px 1fr 120px auto`
1. **Logo:** 44x44 rounded square, `bgDeep`, mono 10px bold `pri` (3-letter company code)
2. **Info block:**
   - Title: sans 14px/600 (clickable → SidePanel)
   - Meta: mono 11px `t400` — "Company / Location / $salary"
   - Tags: flex row of 10px mono pills on `bgInset` bg
3. **MatchDot:** 120px fixed width
4. **Actions:** "Apply" (primary btn) + "Skip" (ghost btn), vertical stack

### 4.6 Jobs Page

**File:** `frontend/src-v2/pages/jobs.tsx`

**Layout:**
```
[Search/Filter Card]
[Job Card 1]
[Job Card 2]
[...]
[Pagination Controls]
```

**Empty state:** "No new jobs. All have been processed." with Target icon

**Pagination:** Simple prev/next buttons with page indicator

### 4.7 SidePanel Integration

When job title or info area is clicked:
1. Set `selectedJobId` in local state
2. `useJobDetail(selectedJobId)` fetches job + match data
3. Open SidePanel via `ui-store.openPanel()`
4. SidePanel renders full match analysis:
   - Summary text
   - Strengths (Check icons) + Concerns (dots)
   - Key Matches / Key Gaps grids
   - Apply/Skip action buttons
5. Apply action: call mutation, close panel, job disappears from list
6. Skip action: call mutation, close panel, job disappears from list

---

## Verification Checklist

- [ ] Job list loads and shows unprocessed jobs only
- [ ] Search filters jobs by query text (debounced)
- [ ] Location type filter works
- [ ] Experience level filter works
- [ ] Sort by match score (default), salary, date
- [ ] Pagination works (next/prev)
- [ ] Job cards show logo, title, company, location, salary, tags, match score
- [ ] MatchDot shows correct color and label per score
- [ ] Clicking "Apply" queues the job and removes from list
- [ ] Clicking "Skip" skips the job and removes from list
- [ ] Clicking job title opens SidePanel with match analysis
- [ ] SidePanel shows strengths, concerns, key matches, key gaps
- [ ] SidePanel Apply/Skip work correctly
- [ ] Empty state shown when no jobs
- [ ] Both themes render correctly

# Phase 6: Profile & Resume (Resume Hangar)

> **Depends on:** Phase 1 (app shell), Phase 2 (shared components)
> **Blocks:** Nothing (independent page)
> **Parallelizable with:** Phases 3-5, 7-9

---

## Goal

Build the Resume Hangar page with contact info editing, resume upload/AI parsing, experience management, and skills management.

---

## API Endpoints Used

| Action | Endpoint | Status |
|--------|----------|--------|
| Load profile | `GET /api/profile` | Ready |
| Update contact | `PUT /api/profile` | Ready |
| Upload resume | `POST /api/profile/resume/upload` | Ready |
| Parse resume | `POST /api/profile/resume/parse` | Ready |
| Get parsed data | `GET /api/profile/resume/parsed` | Ready |
| Update experiences | `PUT /api/profile/experiences` | Ready |
| Update education | `PUT /api/profile/education` | Ready |
| Update skills | `PUT /api/profile/skills` | Ready |

**No API gaps — fully covered.**

---

## Steps

### 6.1 Profile Data Hook

**File:** `frontend/src-v2/hooks/use-profile.ts`

```tsx
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/profile'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) => api.put('/api/profile', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUpdateExperiences() { /* similar */ }
export function useUpdateSkills() { /* similar */ }
```

### 6.2 Resume Upload Hook

**File:** `frontend/src-v2/hooks/use-resume.ts`

```tsx
export function useResumeUpload() {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/api/profile/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
  });

  const parse = useMutation({
    mutationFn: () => api.post('/api/profile/resume/parse'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  return { upload, parse };
}
```

### 6.3 Contact Card

**File:** `frontend/src-v2/components/profile/contact-card.tsx`

**Layout:**
```
Card with CardHeader "CONTACT" + Edit button (right slot)
├── 2x2 grid of Input fields:
│   ├── Name        │ Email
│   ├── Phone       │ Location
│   └── LinkedIn URL (full width, optional)
```

**Edit mode toggle:**
- View mode: read-only Input components showing current values
- Edit mode: editable inputs, "Save" (primary) + "Cancel" (ghost) buttons
- Save: `PUT /api/profile` with changed fields, then toggle back to view mode

### 6.4 Resume Card

**File:** `frontend/src-v2/components/profile/resume-card.tsx`

**Layout:**
```
Card with CardHeader "RESUME" + Upload button (right slot)
├── If resume exists:
│   ├── Filename (mono 12px, t900)
│   ├── Size + Date (mono 10px, t400)
│   └── PARSED badge (if resume_updated_at exists)
├── If no resume:
│   └── Dashed border drop zone
│       "Drop your resume here or click to upload"
│       Upload icon
```

**Upload flow:**
1. User clicks upload or drops PDF file
2. Validate: PDF only, max 10MB
3. `POST /api/profile/resume/upload` with multipart form data
4. Show loading spinner
5. On success: trigger `POST /api/profile/resume/parse`
6. Show "Parsing..." loading state with spinner
7. On parse success: profile data auto-refreshes (experiences/skills populated)
8. Show "PARSED" badge

**Drop zone styling:** dashed 1px `priBorder` border, 10px radius, `priBg` background on hover

### 6.5 Experience Editor

**File:** `frontend/src-v2/components/profile/experience-editor.tsx`

**Layout:**
```
Card with CardHeader "EXPERIENCE" + "+ Add" button (right slot)
├── Experience Entry 1:
│   ├── Title (sans 14px/600) + Company (mono 12px, t400)
│   ├── Date range (mono 11px, t400): "Jan 2023 - Dec 2025"
│   ├── Bullet points with left-border accent (2px pri)
│   │   • "Built React+Node.js features..."
│   │   • "Implemented ML pipeline..."
│   └── Edit/Delete buttons (small, ghost)
├── Experience Entry 2: ...
```

**Edit mode:** Each entry can be edited inline:
- Title, company, location, start_date, end_date fields
- Bullets: text area, one per line
- Save: collects all experiences → `PUT /api/profile/experiences` (bulk replace)

**Add:** Opens blank entry form at top

**Left border accent:** `border-left: 2px solid pri` on bullet container

### 6.6 Skills Editor

**File:** `frontend/src-v2/components/profile/skills-editor.tsx`

**Layout:**
```
Card with CardHeader "SKILLS" + "+ Add" button (right slot)
├── Flex-wrap row of skill tags:
│   ├── [React ×]  [TypeScript ×]  [Python ×]  [Node.js ×]
│   ├── [FastAPI ×]  [PostgreSQL ×]  [Redis ×]  ...
```

**Skill tag styling:** `bgDeep` background, `pri` text, mono 11px/600, 6px 12px padding, 4px radius, nowrap
**Remove:** × button on each tag
**Add:** Input field that appears on "+ Add" click, Enter to add
**Save:** On any add/remove, save via `PUT /api/profile/skills` (bulk replace)

### 6.7 Profile Page Assembly

**File:** `frontend/src-v2/pages/profile.tsx`

**Layout:**
```
[Contact Card (1fr) | Resume Card (1fr)]    — 2-column grid
[Experience Card — full width]
[Skills Card — full width]
```

Grid: `grid grid-cols-2 gap-3.5` for top row, then full-width cards below with `gap-3.5`.

---

## Verification Checklist

- [ ] Profile loads on page visit
- [ ] Contact card shows current profile data
- [ ] Edit mode allows modifying contact fields
- [ ] Save contact changes persists to backend
- [ ] Resume upload accepts PDF files (drag-and-drop + click)
- [ ] Upload rejects non-PDF and files > 10MB
- [ ] After upload, AI parsing triggers automatically
- [ ] Parsing shows loading state
- [ ] After parsing, profile data refreshes with extracted info
- [ ] PARSED badge shows when resume has been parsed
- [ ] Experience entries render with correct formatting
- [ ] Can add new experience entries
- [ ] Can edit existing experience entries
- [ ] Can delete experience entries
- [ ] Bullet points have left-border accent
- [ ] Skills render as tag pills
- [ ] Can add new skills
- [ ] Can remove skills (× button)
- [ ] Both themes render correctly

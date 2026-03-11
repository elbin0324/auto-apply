# Phase 9: Onboarding (Pre-Flight Checklist)

> **Depends on:** Phase 0 (auth), Phase 2 (components), Phase 6 (resume upload components)
> **Blocks:** Nothing
> **Parallelizable with:** Phases 3-8

---

## Goal

Build the 3-step onboarding flow for new users. Full-page takeover (no sidebar/nav). Validates profile and config before completing.

---

## API Endpoints Used

| Action | Endpoint |
|--------|----------|
| Check onboarding status | `GET /api/auth/me` → `onboarding_completed` |
| Get/create profile | `GET /api/profile` |
| Update profile | `PUT /api/profile` |
| Upload resume | `POST /api/profile/resume/upload` |
| Parse resume | `POST /api/profile/resume/parse` |
| Get/create auto-apply config | `GET /api/auto-apply/config` |
| Update config | `PUT /api/auto-apply/config` |
| Complete onboarding | `POST /api/auth/complete-onboarding` |

---

## Steps

### 9.1 Onboarding Layout

**File:** `frontend/src-v2/components/onboarding/onboarding-layout.tsx`

**Full-page design — no sidebar, no status bar, no header.**

```
Dark background (bgBody)
├── Logo at top center (Plane icon + APPLYPILOT wordmark)
├── Title: "PRE-FLIGHT CHECKLIST" (mono 16px/700, t900)
├── Progress Indicator (3 segments)
│   Step 1: Contact  ──  Step 2: Resume  ──  Step 3: Targets
│   Active step: pri color, filled segment
│   Completed: pri color, check icon
│   Upcoming: bgMuted, muted text
├── Step Content Card (centered, max-width ~600px)
│   Current step component
└── Navigation Buttons
    "Back" (ghost, if not step 1) + "Continue" / "Complete Setup" (primary)
```

**Progress indicator:** 3 horizontal segments connected by lines:
- Each segment: circle (numbered or check icon) + label below
- Active: `pri` colored circle, `t900` label
- Completed: `pri` circle with Check icon, `t700` label
- Upcoming: `bgMuted` circle, `t400` label
- Connecting lines: filled `pri` up to current step, `bgMuted` after

### 9.2 Step 1: Contact Info

**File:** `frontend/src-v2/components/onboarding/step-contact.tsx`

**Content:**
```
Card
├── "Tell us about yourself" subtitle
├── Full Name input (required)
├── Email input (required, auto-filled from auth if available)
├── Phone input (optional)
├── Location input (optional)
```

**Validation:** Name and email required before proceeding.
**Save:** `PUT /api/profile` on "Continue"
**Auto-fill:** If user signed up via Google OAuth, email may already be set.

### 9.3 Step 2: Resume Upload

**File:** `frontend/src-v2/components/onboarding/step-resume.tsx`

**Content:**
```
Card
├── "Upload your resume" subtitle
├── Large drop zone (dashed border, Upload icon)
│   "Drop your PDF here or click to upload"
│   Accepted: PDF only, max 10MB
├── After upload:
│   ├── File info (name, size)
│   ├── "Parsing with AI..." loading state
│   └── After parse: "Resume parsed successfully" + PARSED badge
├── "Skip for now" link (optional — allows proceeding without resume)
```

**Flow:**
1. User drops or selects PDF
2. `POST /api/profile/resume/upload` → show upload progress
3. Automatically trigger `POST /api/profile/resume/parse` → show "Parsing..." spinner
4. On success: show confirmation, enable Continue
5. Or user can click "Skip for now" to proceed without resume

**Reuse:** Resume upload and parse logic from Phase 6 hooks (`use-resume.ts`).

### 9.4 Step 3: Target Titles

**File:** `frontend/src-v2/components/onboarding/step-targets.tsx`

**Content:**
```
Card
├── "What roles are you looking for?" subtitle
├── Target Titles tag input (at least 1 required)
│   Tags: [Product Engineer ×] [Full Stack ×]
│   Placeholder: "e.g., Software Engineer, Product Manager"
├── Target Locations tag input (optional)
│   Tags: [Toronto ×] [Remote ×]
│   Placeholder: "e.g., Toronto, Remote, New York"
```

**Validation:** At least one target title required before completing.
**Save:** `PUT /api/auto-apply/config` with `target_titles` and `target_locations`.

**Reuse:** TagInput component from Phase 7.

### 9.5 Completion

**File:** `frontend/src-v2/hooks/use-onboarding.ts`

```tsx
export function useOnboarding() {
  const [step, setStep] = useState(1);

  const complete = useMutation({
    mutationFn: () => api.post('/api/auth/complete-onboarding'),
    onSuccess: () => {
      // Update auth store
      // Navigate to /dashboard
    },
  });

  return { step, setStep, complete };
}
```

On "Complete Setup" (step 3):
1. Validate: profile has `full_name` + `email`, config has at least one `target_title`
2. `POST /api/auth/complete-onboarding`
3. Backend validates, enqueues initial job fetch
4. Update auth store (`onboarding_completed = true`)
5. Redirect to `/dashboard`

### 9.6 Onboarding Page

**File:** `frontend/src-v2/pages/onboarding.tsx`

Wraps steps in the onboarding layout. Uses `AuthOnlyRoute` (auth required but no sidebar/header).

**State management:**
- `currentStep` (1-3) controlled by the page
- Each step's data is saved to backend before advancing
- Back button goes to previous step
- Continue button validates and saves current step, then advances

---

## Verification Checklist

- [ ] Onboarding page renders without sidebar/header (full-page)
- [ ] Progress indicator shows 3 steps
- [ ] Active step highlighted in teal
- [ ] Completed steps show check icon
- [ ] Step 1: Name and email fields, email auto-filled from auth
- [ ] Step 1: Cannot proceed without name and email
- [ ] Step 2: Resume drop zone accepts PDF files
- [ ] Step 2: Upload shows progress
- [ ] Step 2: Parse triggers automatically after upload
- [ ] Step 2: Parse loading state shown
- [ ] Step 2: Can skip resume upload
- [ ] Step 3: Target titles tag input works
- [ ] Step 3: Cannot complete without at least one title
- [ ] Step 3: Locations tag input (optional)
- [ ] Back button works between steps
- [ ] "Complete Setup" calls backend, redirects to dashboard
- [ ] After completion, sidebar/header appear on dashboard
- [ ] Auth guard redirects to onboarding if not completed
- [ ] Both themes render correctly

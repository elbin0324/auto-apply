# ApplyPilot Component Library

> Framework-agnostic specs for every reusable UI component. Each component description includes props, variants, behavior, and which design tokens it reads.

---

## Core Components

### Led
A status indicator dot with colored glow.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `"pri" \| "ok" \| "warn" \| "fail" \| "muted"` | `"pri"` | Semantic color key |
| `size` | number | 6 | Diameter in px |

**Behavior:** Renders a circular dot with the resolved color and a matching `box-shadow` glow (`0 0 {size}px {color}55`). Maps semantic color keys to theme tokens: `pri` → `theme.sig`, `ok` → `theme.sig`, `warn` → `theme.warn`, `fail` → `theme.fail`.

---

### Badge
A mono-font status label with semantic coloring.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `"pri" \| "ok" \| "warn" \| "fail" \| "muted"` | `"pri"` | Semantic color key |
| `children` | string | — | Label text |

**Rendering:** Uppercase mono text (10px, weight 600, letter-spacing .04em). Background, text color, and border are resolved from the theme's `{color}Bg`, `{color}Dim`, and `{color}Border` tokens. Border-radius: 4px. Padding: 3px 10px. White-space: nowrap.

**Variants by color:**
- `pri`: Teal tinted background, teal text, teal border
- `ok`: Ice blue tinted, blue text
- `warn`: Amber tinted, amber text
- `fail`: Red tinted, red text
- `muted`: Gray tinted, gray text

---

### Card
A container surface with border and shadow.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | node | — | Card content |
| `style` | object | `{}` | Style overrides (for border color changes on special cards) |

**Rendering:** Background: `bgCard`. Border: `1px solid border`. Border-radius: 12px. Box-shadow: `sh1`. Overflow: hidden.

---

### CardHeader (CardH)
A card header bar with title, optional count badge, and optional right-side content.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | — | Section title (rendered uppercase mono) |
| `count` | string/number | — | Optional count shown in a mini badge |
| `right` | node | — | Optional right-side content (buttons, tabs) |

**Rendering:** Background: `bgInset`. Padding: 12px 18px. Bottom border: `borderSubtle`. Title: mono 11px weight 600, uppercase, letter-spacing .08em, color `t500`. Count badge: mono 10px, `bgCard` background, `t400` text, 4px radius, `border` outline.

---

### Button (Btn)
Action button with four variants.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "ghost" \| "success" \| "danger"` | `"primary"` | Visual variant |
| `icon` | node | — | Optional leading icon (SVG) |
| `children` | string | — | Button label |
| `onClick` | function | — | Click handler |
| `style` | object | `{}` | Overrides |

**Variants:**
| Variant | Background | Text Color | Border |
|---------|-----------|------------|--------|
| `primary` | `pri` | `bgDeep` | none |
| `ghost` | transparent | `t700` | `1px solid border` |
| `success` | `okBg` | `okDim` | `1px solid okBorder` |
| `danger` | `failBg` | `failDim` | `1px solid failBorder` |

**Shared styles:** Mono font, 11px, weight 600, letter-spacing .03em, uppercase, padding 9px 18px, border-radius 6px, cursor pointer.

---

### StatCard (Stat)
A metric display card with label, value, optional change indicator, and icon.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Metric name (e.g., "Deployed") |
| `value` | string/number | The metric value |
| `change` | string | Optional change text (e.g., "+23% MoM") |
| `icon` | node | SVG icon, rendered at 50% opacity |

**Rendering:** Wraps in a `Card`. Label: mono 10px weight 600, uppercase, letter-spacing .08em, color `t400`. Value: mono 26px weight 700, letter-spacing -.02em, color `t900`. Change: mono 10px, color `okDim`.

---

### Progress
A horizontal progress bar.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pct` | number | — | Percentage (0-100) |
| `color` | string | `pri` | Fill color |

**Rendering:** Track: 5px height, `bgMuted` background, rounded. Fill: same height, `color` background, width set to `{pct}%`, rounded.

---

### MatchDot
The job match score indicator — a colored dot + number + text label.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `score` | number | — | Match score 0-100 |
| `size` | `"sm" \| "md"` | `"md"` | Display size |

**Behavior:**
1. Resolve color from score tier: 90+ → `pri`, 75+ → `ok`, 60+ → `warn`, below → `muted`
2. Resolve label: 90+ "Exceptional", 75+ "Strong", 60+ "Good", 45+ "Moderate", 30+ "Weak", below "Poor"
3. Render: colored dot (8-10px) + score number (mono, bold) + label text (mono, uppercase, `t400`)

**Critical:** Component has a **fixed width** (100px sm, 120px md) to ensure alignment in grid rows. This prevents longer status badges from pushing match indicators left.

---

### JRow (Job Row)
A clickable job listing row used across multiple pages.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `job` | object | Job data (logo, title, co, loc, sal, match, status, tags) |
| `onClick` | function | Opens sidepanel with this job |

**Grid layout:** `44px 1fr 120px 80px` — logo, info, match, status. All columns are fixed-width except info (which truncates with ellipsis).

**Elements:**
1. **Logo:** 40×40px rounded square, `bgDeep` background, mono 10px bold `pri` color, shows 3-letter company code
2. **Info:** Job title (sans 13px bold `t900`) + meta line (mono 11px `t400`: "Company / Location / Salary"). Both lines truncate with ellipsis.
3. **Match:** `MatchDot` component, size "sm"
4. **Status:** `Badge` component if status exists, otherwise empty

**Hover:** Border changes to `priBorder`, subtle glow shadow.

---

### SidePanel
A slide-in detail panel for viewing a single job or application. Appears from the right edge, 440px wide, with a dark overlay behind it.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `job` | object | Full job data including match analysis |
| `onClose` | function | Close handler |

**Structure (top to bottom):**
1. **Header bar:** `bgInset` background, title "Application Detail" or "Job Detail" based on whether `job.status` exists. Close button (X icon) on right.
2. **Company block:** 48px logo + title (16px bold) + company name (mono 12px)
3. **Status badge:** Only shown if application exists
4. **Meta tags:** Horizontal wrap of location, work type, job type, level, salary — each as a mono 10px tag with `bgInset` background
5. **Score circle:** 40px circular badge with match number inside, colored border matching tier. Label + "/100" beside it.
6. **Summary:** Section header (mono 10px uppercase `t400`) + body text (sans 13px `t700`, line-height 1.7)
7. **Fit Analysis:**
   - Strengths: each with a check icon + text
   - Concerns: each with a warning dot + text
8. **Key Matches / Key Gaps:** Two-column grid. Each item has a small dot + mono text.
9. **Skill tags:** Same style as skill tags elsewhere (`bgDeep` bg, `pri` text)
10. **Action buttons:** Pinned to bottom. "Apply + Skip" for new jobs, "Approve + Reject" for pending review.

**Overlay:** Fixed full-screen `rgba(0,0,0,.3)`, click to close.

---

### Input (Inp)
A read-only form input display.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Field label (mono uppercase) |
| `value` | string | Display value |
| `mono` | boolean | Use mono font for value |

---

### Select (Sel)
A disabled select display.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Field label |
| `value` | string | Selected value |

---

## Layout Components

### Systems Status Bar
Persistent bar at top of main content. Dark background (`bgDeep`), 36px tall. Contains:
- Array of subsystem LEDs with labels (mono 9px uppercase)
- Live clock on the right (mono 10px `tw40`)

Subsystems: RES-ENG, ATS-NAV, JOB-RDR, CVR-LTR, STEALTH. Each shows a `Led` (color `pri` for nominal, `warn` for generating/processing). Dividers between items: 1px wide `tw10` colored.

### Page Header
Below systems bar. `bgCard` background, `border` bottom. Contains:
- Page title (mono 16px bold `t900`) + date span (mono 11px `t400`)
- Action buttons: theme toggle (sun/moon), search, notifications (with red dot), "Quick Apply" primary button

### Sidebar
Fixed left, 240px wide, `bgSidebar` background. Contains:
- Logo: 30px teal square with plane icon + "APPLYPILOT" wordmark
- Nav sections: MISSION CTRL, OPS, SYS — each with items
- Active nav item: `priBg` background, `priBorder` border, `pri` text
- Inactive: `tw60` text, transparent background
- Badges on nav items (e.g., "24", "4"): small mono pills
- Bottom: subscription tier label + usage progress bar + upgrade button

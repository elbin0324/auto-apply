# ApplyPilot Design System — Deep Ocean

> Source of truth for all visual design decisions. Framework-agnostic — implement as CSS variables, Tailwind theme, styled-components tokens, or whatever your stack uses.

---

## 1. Color Palette

ApplyPilot uses a **dual-theme system** (dark default, light variant) with a shared semantic color layer. The sidebar always stays dark in both modes.

### 1.1 Theme Tokens

#### Dark Theme (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `bgDeep` | `#060d14` | Systems bar, deepest background |
| `bgSidebar` | `#081018` | Sidebar navigation |
| `bgBody` | `#0c1520` | Main content area background |
| `bgCard` | `#111c2a` | Card/panel surfaces |
| `bgInset` | `#0e1824` | Card headers, inset areas |
| `bgMuted` | `#182838` | Progress bar tracks, disabled areas |

#### Light Theme

| Token | Hex | Usage |
|-------|-----|-------|
| `bgDeep` | `#0a1520` | Systems bar (stays dark) |
| `bgSidebar` | `#0c1720` | Sidebar (stays dark) |
| `bgBody` | `#f0f4f7` | Main content area |
| `bgCard` | `#ffffff` | Card surfaces |
| `bgInset` | `#e8eef4` | Card headers, inset areas |
| `bgMuted` | `#dce4ec` | Progress bar tracks |

### 1.2 Semantic Colors (Shared Across Themes)

#### Primary — Teal Aqua
The brand color. Used for: active states, CTAs, selected nav items, branding, the "PILOT" wordmark, queued status, skill tags, in-flight progress.

| Token | Value | Usage |
|-------|-------|-------|
| `pri` | `#2ec4b6` | Primary color |
| `priDim` | `#1a9a8e` | Dimmed primary (text on light bg) |
| `priLight` | `#50dace` | Light primary (gradient end) |
| `priBg` | `rgba(46,196,182,.07)` dark / `rgba(46,196,182,.06)` light | Primary background tint |
| `priBorder` | `rgba(46,196,182,.2)` / `rgba(46,196,182,.18)` | Primary border |
| `priGlow` | `rgba(46,196,182,.1)` | Hover glow shadow |

#### Success — Ice Blue
Used for: landed/applied status, interview counts, high match scores (90+), ATS bars with high success rates.

| Token | Value |
|-------|-------|
| `ok` | `#64b5cf` |
| `okDim` | `#3a8eaa` |
| `okBg` | `rgba(100,181,207,.07)` dark / `#edf5f8` light |
| `okBorder` | `rgba(100,181,207,.18)` / `rgba(100,181,207,.2)` |

#### Signal — Teal (LEDs only)
Status bar LED indicators use the primary color for "nominal" state.

| Token | Value |
|-------|-------|
| `sig` | `#2ec4b6` |

#### Warning — Warm Amber
Used for: pending review status, cover letter generating indicator, medium match scores (60-74).

| Token | Value |
|-------|-------|
| `warn` | `#e0a850` |
| `warnDim` | `#b88030` |
| `warnBg` | `rgba(224,168,80,.07)` dark / `#fdf8ee` light |
| `warnBorder` | `rgba(224,168,80,.18)` / `rgba(224,168,80,.2)` |

#### Failure — Soft Red
Used for: failed status, reject buttons, notification dots, low ATS success rates.

| Token | Value |
|-------|-------|
| `fail` | `#d06060` |
| `failDim` | `#a84040` |
| `failBg` | `rgba(208,96,96,.07)` dark / `#faf0f0` light |
| `failBorder` | `rgba(208,96,96,.18)` |

#### Muted — Neutral
Used for: skipped status, disabled states, below-threshold match scores.

| Token | Value |
|-------|-------|
| `muted` | `#4a6070` dark / `#8a9aaa` light |
| `mutedBg` | `rgba(74,96,112,.12)` dark / `#edf1f5` light |
| `mutedBorder` | `rgba(74,96,112,.2)` / `rgba(138,154,170,.15)` |

### 1.3 Text Colors

#### On Light Backgrounds (light theme cards/body)

| Token | Value | Usage |
|-------|-------|-------|
| `t900` | `#0c1520` | Headings, primary text |
| `t700` | `#283848` | Body text |
| `t500` | `#506878` | Secondary text, labels |
| `t400` | `#8094a6` | Muted text, timestamps |
| `t300` | `#b0c0cc` | Very faint, dividers |

#### On Dark Backgrounds (dark theme cards/body, sidebar in both)

| Token | Value | Usage |
|-------|-------|-------|
| `t900` | `#e0e8f0` | Headings, primary text |
| `t700` | `#b0c0d0` | Body text |
| `t500` | `#708090` | Secondary text |
| `t400` | `#506070` | Muted text |
| `t300` | `#384858` | Very faint |

#### Sidebar/Systems Bar Text (always dark bg)

| Token | Value | Usage |
|-------|-------|-------|
| `tw90` | `rgba(255,255,255,.88)` | Logo, active items |
| `tw60` | `rgba(255,255,255,.55)` | Nav items, LED labels |
| `tw40` | `rgba(255,255,255,.35)` | Section labels, clock |
| `tw20` | `rgba(255,255,255,.15)` | Borders on dark bg |
| `tw10` | `rgba(255,255,255,.08)` | Subtle borders/dividers |

### 1.4 Borders

| Token | Dark | Light |
|-------|------|-------|
| `border` | `#1e2e3e` | `#d0dae4` |
| `borderSubtle` | `#182838` | `#e4ecf2` |

### 1.5 Status-to-Color Mapping

| Application Status | Color Token | Badge Label |
|-------------------|-------------|-------------|
| `queued` | `pri` | QUEUED |
| `in_progress` | `pri` | IN-FLIGHT |
| `pending_review` | `warn` | REVIEW |
| `applied` | `ok` | LANDED |
| `failed` | `fail` | FAILED |
| `skipped` | `muted` | SKIPPED |
| `null` (new) | — | NEW |

### 1.6 Match Score Tiers

| Score Range | Label | Color Token |
|-------------|-------|-------------|
| 90–100 | Exceptional match | `pri` (teal) |
| 75–89 | Strong match | `ok` (ice blue) |
| 60–74 | Good fit | `warn` (amber) |
| 45–59 | Moderate fit | `muted` |
| 30–44 | Weak fit | `muted` |
| 0–29 | Poor fit | `muted` |

---

## 2. Typography

### 2.1 Font Stack

| Role | Font | Fallback |
|------|------|----------|
| **Monospace (primary)** | JetBrains Mono | SF Mono, Fira Code, monospace |
| **Sans (body)** | Inter | -apple-system, BlinkMacSystemFont, sans-serif |

**Load:** `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700`

### 2.2 Usage Rules

JetBrains Mono is the **dominant** typeface. Used for:
- All navigation labels
- All section headers (card headers, page titles)
- All data values (stats, scores, prices, dates)
- All badges and status indicators
- All form labels
- Activity feed entries
- Table headers and mono data
- Timestamps, counters, codes

Inter (sans) is used sparingly for:
- Body text in paragraphs (job summaries, fit analysis prose)
- Job title text in rows (slightly more readable at small sizes)
- Form input values

### 2.3 Type Scale

| Element | Font | Size | Weight | Letter-Spacing | Transform |
|---------|------|------|--------|----------------|-----------|
| Page title | Mono | 16px | 700 | .04em | none |
| Stat value | Mono | 26px | 700 | -.02em | none |
| Card header label | Mono | 11px | 600 | .08em | uppercase |
| Nav section label | Mono | 9px | 700 | .14em | uppercase |
| Nav item | Mono | 11px | 500 | — | none |
| Badge | Mono | 10px | 600 | .04em | uppercase |
| Systems bar label | Mono | 9px | 600 | .08em | uppercase |
| Job title (row) | Sans | 13px | 600 | — | none |
| Job meta (row) | Mono | 11px | 400 | — | none |
| Form label | Mono | 10px | 600 | .06em | uppercase |
| Form input value | Sans/Mono | 13px | 400 | — | none |
| Button text | Mono | 11px | 600 | .03em | uppercase |
| Timestamp | Mono | 10px | 400 | — | none |
| Match score number | Mono | 11px | 700 | — | none |
| Match label | Mono | 9px | 400 | .03em | uppercase |

---

## 3. Spacing & Layout

### 3.1 Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius` | 8px | Buttons, inputs, badges, rows |
| `radiusLg` | 12px | Cards, panels |

### 3.2 Layout Constants

| Element | Value |
|---------|-------|
| Sidebar width | 240px |
| Systems bar height | 36px |
| Page header height | ~56px |
| Content padding | 20px 28px |
| Card internal padding | 14–18px |
| Gap between cards | 14–16px |

### 3.3 Grid Patterns

- **Stats row:** 4 equal columns, 14px gap
- **Dashboard main:** `1fr 340px` (pipeline + activity feed)
- **Dashboard bottom:** `1fr 1fr` (ATS + chart)
- **Job row columns:** `44px 1fr 120px 80px` (logo, info, match, status) — **fixed widths for alignment**
- **Profile/Config:** `1fr 1fr` two-column layout
- **Tracker stats:** 5 equal columns

---

## 4. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `sh1` | `0 1px 3px rgba(0,0,0,.06)` | Cards default |
| `sh2` | `0 2px 8px rgba(0,0,0,.1)` | Elevated cards |
| Sidepanel shadow | `-8px 0 30px rgba(0,0,0,.15)` | Slide-in panel |
| Overlay | `rgba(0,0,0,.3)` | Sidepanel backdrop |

---

## 5. Interaction States

### Hover
- Job rows: border changes to `priBorder`, add `box-shadow: 0 0 0 2px ${priGlow}`
- Buttons: no explicit hover in prototype (add subtle brightness/shadow shift in production)
- Nav items: background lightens slightly
- Table rows: background changes to `bgInset`

### Active/Selected
- Nav item: `priBg` background, `priBorder` border, text color `pri`
- Tab (active): tinted background matching tab color, solid border
- Checkbox (selected): `pri` background with white checkmark

### Disabled
- Inputs: reduced opacity, `bgCard` background
- Buttons: not explicitly defined — use 50% opacity

---

## 6. Icon System

All icons are inline SVGs with `stroke` rendering (no fills except play/stop icons). Standard size: 14–16px for UI, 18px for stat card accents.

Icon set: plane, target, radar, doc, sliders, bot, chart, gear, search, bell, check, x, queue, upload, shield, play, stop, sun, moon.

No emojis anywhere in the UI.

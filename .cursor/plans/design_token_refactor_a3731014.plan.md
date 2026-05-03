---
name: Design Token Refactor
overview: Replace ALL hardcoded visual values (colors, typography, buttons, radii, shadows, icon sizes) across ~38 files with centralized CSS custom property tokens + Tailwind utility classes. Zero arbitrary values allowed after this refactor.
todos:
  - id: define-color-tokens
    content: "Define all color tokens in theme.css :root: surfaces, text, borders, status, accent, overlay, interactive"
    status: completed
  - id: define-typography-tokens
    content: "Define all typography tokens: font families, weights (300/400/510/590), text size classes with letter-spacing and line-height presets"
    status: completed
  - id: define-button-tokens
    content: Define button variant classes (primary, ghost, subtle, icon, pill, toolbar) as @layer components utilities in theme.css
    status: completed
  - id: define-radius-shadow-tokens
    content: Define radius scale (micro/standard/comfortable/card/panel/large/pill/circle) and elevation shadow tokens
    status: completed
  - id: define-icon-spacing-tokens
    content: Define icon size tokens (xs=12, sm=14, md=16, lg=20, xl=24, 2xl=32) and spacing scale
    status: completed
  - id: register-tailwind
    content: Register all tokens in @theme inline so Tailwind generates utility classes (bg-surface-panel, text-body-sm, rounded-card, shadow-modal, etc.)
    status: completed
  - id: replace-colors
    content: Replace all hardcoded color values in className strings across all ~38 component files
    status: completed
  - id: replace-typography
    content: Replace all hardcoded text-[Npx] font-[N] tracking-[...] leading-[...] with token utility classes
    status: completed
  - id: replace-buttons
    content: Replace all inline button styling with button variant classes
    status: completed
  - id: replace-radius-shadow
    content: Replace all hardcoded rounded-[Npx] and shadow-[...] with token classes
    status: completed
  - id: validate-zero-hardcodes
    content: Run rg to verify zero remaining arbitrary values in className strings, run tests, build check
    status: completed
isProject: false
---

# Complete Design Token Refactor

## Problem

~60 unique hardcoded color literals, ~15 font-size/weight/tracking combos, ~6 button variant patterns, ~7 radius values, and ~6 shadow patterns are scattered as arbitrary Tailwind values across 38 files. The token system in [src/styles/theme.css](src/styles/theme.css) exists but is ignored. This violates Rule 1 (SSOT), Rule 4 (No Hardcoding), and Rule 5 (No Inline Styling).

## Token System

### 1. Colors

**Surfaces:**
- `--surface-base: #08090a` -- deepest page canvas
- `--surface-panel: #0f1011` -- sidebar, panels, headers
- `--surface-elevated: #191a1b` -- menus, dropdowns
- `--surface-frost-01` through `--surface-frost-08` -- `rgba(255,255,255, 0.01-0.08)` translucent ladder

**Text:**
- `--text-primary: #f7f8f8`
- `--text-secondary: #d0d6e0`
- `--text-tertiary: #8a8f98`
- `--text-quaternary: #62666d`

**Borders:**
- `--border-subtle: rgba(255,255,255,0.05)`
- `--border-default: rgba(255,255,255,0.08)`
- `--border-strong: rgba(255,255,255,0.1)`
- `--border-hover: rgba(255,255,255,0.12)`
- `--border-focus: rgba(255,255,255,0.2)`

**Status (solid + alpha variants for surface/border):**
- `--status-success: #10b981` + `--status-success-surface`, `--status-success-border`
- `--status-warning: #f59e0b` + variants
- `--status-error: #ef4444` + variants

**Accent:** `--accent: #7170ff`, `--accent-hover: #828fff` + alpha surface/border variants

**Overlay:** `--overlay-scrim: rgba(0,0,0,0.85)`

### 2. Typography

Utility classes defined as `@layer components` combining size + weight + tracking + line-height into single classes:

- `.text-display-xl` -- 72px / 510 / -1.584px / 1.00
- `.text-display-lg` -- 64px / 510 / -1.408px / 1.00
- `.text-display` -- 48px / 510 / -1.056px / 1.00
- `.text-h1` -- 32px / 400 / -0.704px / 1.13
- `.text-h2` -- 24px / 400 / -0.288px / 1.33
- `.text-h3` -- 20px / 590 / -0.24px / 1.33
- `.text-body-lg` -- 18px / 400 / -0.165px / 1.60
- `.text-body` -- 16px / 400 / normal / 1.50
- `.text-body-medium` -- 16px / 510 / normal / 1.50
- `.text-body-semibold` -- 16px / 590 / normal / 1.50
- `.text-sm` -- 15px / 400 / -0.165px / 1.60
- `.text-sm-medium` -- 15px / 510 / -0.165px / 1.60
- `.text-caption-lg` -- 14px / 510 / -0.182px / 1.50
- `.text-caption` -- 13px / 510 / -0.13px / 1.50
- `.text-label` -- 12px / 510 / normal / 1.40
- `.text-label-sm` -- 11px / 510 / normal / 1.40
- `.text-tiny` -- 10px / 510 / -0.15px / 1.50
- `.text-section-label` -- 11px / 510 / widest / uppercase (column headers like "1. REQUIREMENTS")

Font weight tokens: `--fw-light: 300`, `--fw-regular: 400`, `--fw-medium: 510`, `--fw-semibold: 590`

### 3. Button Variants

Defined as `@layer components` classes:

- `.btn-primary` -- white bg, black text, hover `#e0e0e0`, 6px radius, h-10, 14px/510 text
- `.btn-ghost` -- frost-02 bg, default border, secondary text, hover frost-04
- `.btn-subtle` -- frost-04 bg, no border, secondary text
- `.btn-icon` -- frost-05 bg, circle/square, quaternary text, hover primary
- `.btn-pill` -- transparent bg, pill radius, secondary text, solid border
- `.btn-toolbar` -- frost-05 bg, 2px radius, quaternary text, label size
- `.btn-destructive` -- error bg alpha, error text, error border

### 4. Border Radius

Tokens registered as Tailwind `borderRadius`:

- `--radius-micro: 2px` -> `rounded-micro`
- `--radius-standard: 4px` -> `rounded-standard`
- `--radius-comfortable: 6px` -> `rounded-comfortable`
- `--radius-card: 8px` -> `rounded-card`
- `--radius-panel: 12px` -> `rounded-panel`
- `--radius-large: 22px` -> `rounded-large`
- `--radius-pill: 9999px` -> `rounded-pill`

### 5. Elevation / Shadows

Named shadow tokens:

- `--shadow-subtle` -- toolbar button micro-elevation
- `--shadow-ring` -- `0 0 0 1px rgba(0,0,0,0.2)` border-as-shadow
- `--shadow-elevated` -- floating dropdown shadow
- `--shadow-modal` -- multi-layer dialog shadow
- `--shadow-focus` -- keyboard focus ring
- `--shadow-inset` -- recessed panel

### 6. Icon Sizes

Tokens for consistent icon sizing (consumed as Tailwind `size-*`):

- `--icon-xs: 12px`
- `--icon-sm: 14px`
- `--icon-md: 16px`
- `--icon-lg: 20px`
- `--icon-xl: 24px`
- `--icon-2xl: 32px`

## Execution Strategy

### Phase 1: Define everything in theme.css

All tokens, typography classes, button variant classes, radius/shadow/icon tokens in one file.

### Phase 2: Register in @theme inline

Map CSS variables to Tailwind so all token classes are available in utilities.

### Phase 3: Systematic replacement (by category)

Work through files category-by-category:
- Colors first (largest surface area)
- Typography second (every component uses text sizing)
- Buttons third (6 variants across many files)
- Radius/shadow fourth

### Phase 4: Validation

- `rg` for zero remaining `[#`, `[rgba(`, `text-[N`, `font-[N`, `tracking-[`, `rounded-[`, `shadow-[` in className strings
- All tests pass
- Build succeeds

## Files Changed

- [src/styles/theme.css](src/styles/theme.css) -- complete token system
- ~38 component files -- all arbitrary values replaced
- [src/imports/DESIGN.md](src/imports/DESIGN.md) -- updated with token names alongside values

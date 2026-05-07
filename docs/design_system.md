# Design System

This document is the **enforceable specification** for all visual implementation in the Arvid codebase.
Every color, font, radius, shadow, and component style **must** reference the centralized token system.
Hardcoded values are forbidden. If it's visual, it comes from a token.

---

## Single Source of Truth

| Concern | Source file | Consumed via |
|---------|-----------|--------------|
| All tokens (colors, radius, shadows, weights) | `src/styles/theme.css` `:root` | Tailwind utility classes |
| Tailwind class registration | `src/styles/theme.css` `@theme inline` | `bg-*`, `text-*`, `border-*`, `rounded-*`, `shadow-*` |
| Typography presets | `src/styles/theme.css` `@layer components` | `.text-h1`, `.text-caption`, etc. |
| Button variants | `src/styles/theme.css` `@layer components` | `.btn-primary`, `.btn-ghost`, etc. |
| Design rationale | `src/imports/DESIGN.md` | Reference only |

**Never** define colors, font weights, radii, or shadows inline or as Tailwind arbitrary values.
**Always** use the token classes listed below.

---

## Colors

### Surfaces

| Token | Tailwind class | Value | Use |
|-------|---------------|-------|-----|
| `--surface-base` | `bg-surface-base` | `#08090a` | Page background, deepest canvas |
| `--surface-panel` | `bg-surface-panel` | `#0f1011` | Sidebar, panels, headers |
| `--surface-elevated` | `bg-surface-elevated` | `#191a1b` | Menus, dropdowns, elevated cards |
| `--surface-menu` | `bg-surface-menu` | `#1a1c1e` | Popover/dropdown menus |
| `--surface-frost-{01-15}` | `bg-surface-frost-{01-15}` | `rgba(255,255,255, 0.01-0.15)` | Translucent surface ladder |

**Frost ladder usage:**
- `frost-02`: Default card/container background, ghost button fill
- `frost-04`: Hover states, subtle button fill, focus field fill
- `frost-05`: Active states, icon button fill, toolbar button fill
- `frost-08`: Selected item background
- `frost-10`: Strong hover, icon button hover

### Text

| Token | Tailwind class | Value | Use |
|-------|---------------|-------|-----|
| `--text-primary` | `text-text-primary` | `#f7f8f8` | Primary content, headings |
| `--text-secondary` | `text-text-secondary` | `#d0d6e0` | Body text, descriptions |
| `--text-tertiary` | `text-text-tertiary` | `#8a8f98` | Metadata, placeholders, labels |
| `--text-quaternary` | `text-text-quaternary` | `#62666d` | Disabled text, timestamps |
| `--text-empty` | `text-text-empty` | `#4a4e54` | Empty state hints |
| `--text-on-primary` | `text-text-on-primary` | `#000000` | Text on white primary buttons |

### Borders

| Token | Tailwind class | Value | Use |
|-------|---------------|-------|-----|
| `--border-subtle` | `border-border-subtle` | `rgba(255,255,255,0.05)` | Subtle dividers, section separators |
| `--border-default` | `border-border-default` | `rgba(255,255,255,0.08)` | Standard card/input borders |
| `--border-strong` | `border-border-strong` | `rgba(255,255,255,0.1)` | Modal borders, strong separators |
| `--border-hover` | `border-border-hover` | `rgba(255,255,255,0.12)` | Hover border emphasis |
| `--border-focus` | `border-border-focus` | `rgba(255,255,255,0.2)` | Focus/selected borders |
| `--border-focus-max` | `border-border-focus-max` | `rgba(255,255,255,0.3)` | Maximum focus intensity |

### Status

Each status color has a solid token plus alpha variants for surfaces and borders.

| Solid | Surface | Border | Use |
|-------|---------|--------|-----|
| `text-status-success` / `bg-status-success` | `bg-status-success-surface` | `border-status-success-border` | Answered, complete, active |
| `text-status-warning` / `bg-status-warning` | `bg-status-warning-surface` | `border-status-warning-border` | Conflicting, medium risk |
| `text-status-error` / `bg-status-error` | `bg-status-error-surface` | `border-status-error-border` | Unanswered, high risk, errors |

### Indicator (Green Intensity Scale)

Used for clarity, risk, and severity dots on cards. Stronger green = higher/better value.

| Token | Tailwind class | Value | Use |
|-------|---------------|-------|-----|
| `--indicator-high` | `bg-indicator-high` | `#10b981` | High clarity, low risk, critical severity |
| `--indicator-medium` | `bg-indicator-medium` | `rgba(16,185,129,0.5)` | Medium clarity/risk/severity |
| `--indicator-low` | `bg-indicator-low` | `rgba(16,185,129,0.2)` | Low clarity, high risk, optional severity |

### Accent

| Token | Tailwind class | Value | Use |
|-------|---------------|-------|-----|
| `--accent` | `text-accent` / `bg-accent` | `#7170ff` | Interactive accent, links |
| `--accent-hover` | `text-accent-hover` | `#828fff` | Accent hover state |
| `--accent-brand` | `bg-accent-brand` | `#5e6ad2` | Brand indigo (used sparingly) |
| `--accent-surface` | `bg-accent-surface` | `rgba(113,112,255,0.15)` | Accent-tinted fill |
| `--accent-border` | `border-accent-border` | `rgba(113,112,255,0.3)` | Accent-tinted border |

### Overlay

| Token | Tailwind class | Use |
|-------|---------------|-----|
| `--overlay-scrim` | `bg-overlay-scrim` | Modal backdrop (`rgba(0,0,0,0.85)`) |

---

## Typography

### Presets

Use these classes instead of combining `text-[Npx] font-[N] tracking-[...] leading-[...]` manually.

| Class | Size | Weight | Tracking | Line Height | Use |
|-------|------|--------|----------|-------------|-----|
| `.text-display-xl` | 72px | 510 | -1.584px | 1.00 | Hero headlines |
| `.text-display-lg` | 64px | 510 | -1.408px | 1.00 | Secondary hero |
| `.text-display` | 48px | 510 | -1.056px | 1.00 | Section headlines |
| `.text-h1` | 32px | 400 | -0.704px | 1.13 | Page titles |
| `.text-h2` | 24px | 400 | -0.288px | 1.33 | Section headings |
| `.text-h3` | 20px | 590 | -0.24px | 1.33 | Card headers |
| `.text-body-lg` | 18px | 400 | -0.165px | 1.60 | Introduction text |
| `.text-body` | 16px | 400 | normal | 1.50 | Standard reading |
| `.text-body-md` | 16px | 510 | normal | 1.50 | Navigation, labels |
| `.text-body-sb` | 16px | 590 | normal | 1.50 | Strong emphasis |
| `.text-sm` | 15px | 400 | -0.165px | 1.60 | Secondary body |
| `.text-sm-md` | 15px | 510 | -0.165px | 1.60 | Emphasized small |
| `.text-caption-lg` | 14px | 510 | -0.182px | 1.50 | Sub-labels |
| `.text-caption` | 13px | 510 | -0.13px | 1.50 | Metadata, buttons |
| `.text-label` | 12px | 510 | normal | 1.40 | Small labels |
| `.text-label-sm` | 11px | 510 | normal | 1.40 | Tiny labels |
| `.text-tiny` | 10px | 510 | -0.15px | 1.50 | Overline text |
| `.text-section` | 11px | 510 | widest | 1.40 | Column headers (uppercase) |

### Font Weights

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| `--fw-light` | 300 | `font-[var(--fw-light)]` | De-emphasized only |
| `--fw-regular` | 400 | `font-[var(--fw-regular)]` | Reading text |
| `--fw-medium` | 510 | `font-[var(--fw-medium)]` | Default emphasis, UI text |
| `--fw-semibold` | 590 | `font-[var(--fw-semibold)]` | Strong emphasis |

### Rules

- `font-feature-settings: "cv01", "ss03"` is set globally on `body` -- never set it inline.
- Weight 510 is the signature weight -- use it for all UI text, labels, and navigation.
- Never use weight 700 (bold). Maximum is 590.

---

## Buttons

### Variant Classes

| Class | Background | Text | Border | Use |
|-------|-----------|------|--------|-----|
| `.btn-primary` | White | Black | None | Primary CTAs (Create, Submit, Sign in) |
| `.btn-ghost` | `frost-02` | Secondary | Default | Standard actions, secondary CTAs |
| `.btn-subtle` | `frost-04` | Secondary | None | Toolbar actions, contextual |
| `.btn-destructive` | Error fill | Error | Error border | Delete, remove actions |

### How to Use

```jsx
<button className="btn-primary px-4 py-2">Create</button>
<button className="btn-ghost px-4 py-2">Cancel</button>
<button className="btn-destructive px-4 py-2">Delete</button>
```

---

## Border Radius

| Token | Tailwind class | Value | Use |
|-------|---------------|-------|-----|
| `--radius-micro` | `rounded-micro` | 2px | Inline badges, toolbar buttons |
| `--radius-standard` | `rounded-standard` | 4px | Small containers, list items |
| `--radius-comfortable` | `rounded-comfortable` | 6px | Buttons, inputs |
| `--radius-card` | `rounded-card` | 8px | Cards, dropdowns |
| `--radius-panel` | `rounded-panel` | 12px | Panels, modals, featured cards |
| `--radius-large` | `rounded-large` | 22px | Large panel elements |
| `--radius-pill` | `rounded-pill` | 9999px | Chips, filter pills, status tags |

---

## Shadows / Elevation

| Token | Tailwind class | Use |
|-------|---------------|-----|
| `--shadow-subtle` | `shadow-subtle` | Toolbar button micro-elevation |
| `--shadow-ring` | `shadow-ring` | Border-as-shadow technique |
| `--shadow-elevated` | `shadow-elevated` | Floating elements, dropdowns |
| `--shadow-modal` | `shadow-modal` | Dialog/modal shadows |
| `--shadow-focus` | `shadow-focus` | Keyboard focus ring |
| `--shadow-inset` | `shadow-inset` | Recessed panels |
| `--shadow-card-selected` | `shadow-card-selected` | Selected card inset ring |
| `--shadow-accent-selected` | `shadow-accent-selected` | Accent-tinted selected ring |

---

## Spacing

Spacing tokens are registered in Tailwind as `--spacing-{N}` and used via standard utility classes (`p-4`, `gap-2`, `m-6`, etc.).

| Token | Tailwind | Value | Use |
|-------|----------|-------|-----|
| `--space-1` | `p-1`, `gap-1`, `m-1` | 4px | Card internal gap, tight spacing |
| `--space-2` | `p-2`, `gap-2`, `m-2` | 8px | Chip padding, icon gaps |
| `--space-3` | `p-3`, `gap-3`, `m-3` | 12px | Compact section spacing |
| `--space-4` | `p-4`, `gap-4`, `m-4` | 16px | Card padding, column padding, standard gap |
| `--space-5` | `p-5`, `gap-5`, `m-5` | 20px | Summary panel padding |
| `--space-6` | `p-6`, `gap-6`, `m-6` | 24px | Section margins |
| `--space-8` | `p-8`, `gap-8`, `m-8` | 32px | Large section spacing |
| `--space-10` | `p-10`, `gap-10`, `m-10` | 40px | Hero section spacing |
| `--space-12` | `p-12`, `gap-12`, `m-12` | 48px | Feature section spacing |
| `--space-16` | `p-16`, `gap-16`, `m-16` | 64px | Page-level vertical spacing |
| `--space-20` | `p-20`, `gap-20`, `m-20` | 80px | Large page-level spacing |
| `--space-24` | `p-24`, `gap-24`, `m-24` | 96px | Maximum page-level spacing |

---

## Icon Sizes

| Token | Value | Use |
|-------|-------|-----|
| `--icon-xs` | 12px | Tiny inline icons (chevrons, status dots) |
| `--icon-sm` | 14px | Standard inline icons (buttons, labels) |
| `--icon-md` | 16px | Default icon size |
| `--icon-lg` | 20px | Feature icons, card headers |
| `--icon-xl` | 24px | Loading spinners, empty states |
| `--icon-2xl` | 32px | Large empty state icons |

---

## Icon Button

All interactive icons (toolbar actions, toggles, triggers) **must** use the `<IconButton>` component from `src/app/components/IconButton.tsx`.

### Component API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClick` | `(e: MouseEvent) => void` | — | Click handler |
| `title` | `string` | — | Tooltip text |
| `children` | `ReactNode` | — | Icon element (lucide) |
| `className` | `string` | `''` | Additional classes |

### Behavior

- `flex items-center justify-center` — prevents line-height inflation from inline SVGs
- `p-1` — provides adequate click target (icon + 4px padding each side)
- Ghost style — no background on hover, only color transitions (`text-text-quaternary` → `text-text-primary`)
- Icon size: always `--icon-sm` (14px) via lucide `size={14}` for consistency

### Anti-patterns

- **Custom `<button>` wrapping an icon** — use `<IconButton>` instead
- **Adding `hover:bg-*`** to icon buttons — the ghost style is the standard
- **Mixing icon sizes** across toolbars — all icon buttons use `--icon-sm` (14px)
- **Omitting `flex`** on buttons containing SVGs — causes line-height inflation

---

## Runtime CSS Variables

Two exceptions exist for runtime-computed values (documented per Rule 21):

| Variable | Set via | Consumed by | Use |
|----------|---------|-------------|-----|
| `--depth` | `style={{ '--depth': N }}` | CSS rule in `@layer base` | Tree indentation (sidebar, project picker) |
| `--progress` | `style={{ '--progress': 'N%' }}` | CSS rule in `@layer base` | Progress bar width |

These are the **only** permitted uses of React `style={{}}`. All other styling must use token classes.

---

## Disclosure Chevron

All expand/collapse indicators across the platform **must** use the canonical `<Chevron>` component from `src/app/components/Chevron.tsx`.

### Component API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the section is expanded |
| `size` | `number` | `14` | Icon size in px — must match an icon size token |
| `className` | `string` | — | Additional classes (e.g. `group-open:rotate-90` for `<details>`) |

### Behavior

- Renders a single `ChevronRight` icon that **rotates 90°** when `open` is true.
- Uses `text-text-quaternary` color, `shrink-0`, and a 200ms transition.
- Never swap between `ChevronRight` and `ChevronDown` — the rotation handles the visual state.

### Size Guidelines

| Context | Size | Token |
|---------|------|-------|
| Standard content areas (columns, summaries) | `14` (default) | `--icon-sm` |
| Compact tree items (sidebar projects, teams) | `12` | `--icon-xs` |

### Anti-patterns

- **Importing `ChevronDown`/`ChevronRight` directly from lucide** for disclosure — use `<Chevron>` instead.
- **Swapping between two icons** to indicate open/closed — the component handles this via rotation.
- **Using arbitrary sizes** (e.g. 10, 8) that don't match icon size tokens.
- **Duplicating the transition/color logic** instead of consuming the component.

---

## Enforcement Rules

1. **No hardcoded hex values** in `className` strings. Use `bg-surface-*`, `text-text-*`, etc.
2. **No hardcoded rgba values** in `className` strings. Use token classes.
3. **No `font-[N]` arbitrary weights**. Use `font-[var(--fw-*)]` tokens.
4. **No `rounded-[Npx]` arbitrary radii**. Use `rounded-micro` through `rounded-pill`.
5. **No `shadow-[...]` arbitrary shadows**. Use `shadow-subtle` through `shadow-modal`.
6. **No inline `style={{}}` for colors, fonts, or visual properties**. Only `--depth` and `--progress` are permitted.
7. **No `fontFeatureSettings` inline**. It is set globally on `body`.
8. **All new colors** must be added to `:root` in `theme.css`, registered in `@theme inline`, and documented here.
9. **All new components** must use only token classes. No exceptions without documentation per Rule 21.

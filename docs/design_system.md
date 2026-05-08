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

## Base Component Architecture (CRITICAL)

**This is the most important rule in the design system.**

All UI components follow a strict base/consumer separation:

**Base components** (`src/app/components/ui/`) own **ALL** visual styling — every token class for backgrounds, borders, radii, shadows, spacing, typography, transitions, z-index, and positioning. Base components expose **typed props** (`variant`, `position`, `isOpen`, `icon`, `label`, etc.) that control visual variations internally.

**Consumer components** (every component that uses a base component) pass **data props only**. They describe **what** they need, never **how** it looks.

### Rules

1. **Consumer components MUST NOT pass `className` to base components.** Base components do not accept `className`. There are zero exceptions.
2. **Consumer components MUST NOT add any Tailwind classes** that affect the visual output of a base component — no border overrides, no padding overrides, no font overrides, no radius overrides, no shadow overrides, no positioning overrides.
3. **If a visual variation is needed**, it is a **prop on the base component** with the styling handled internally by the base. The consumer passes the prop value. The base decides the CSS.
4. **Base components are the SSOT for their visual domain.** Changing a token in the base automatically updates every consumer. No consumer can diverge.
5. **No duplicate base components.** If two components render the same visual pattern (e.g. section headers), they must share the same base or use the same token class. Having two implementations of the same visual element is forbidden.

### Example

```tsx
// CORRECT — consumer passes props, base owns styling
<DropdownPanel variant="attached" position="above">
  <DropdownSection label="PUBLIC">
    <DropdownItem icon={<Globe size={16} />} label="arvid/arvid" onClick={...} />
  </DropdownSection>
</DropdownPanel>

// WRONG — consumer adds className, overrides tokens
<DropdownPanel className="absolute bottom-full mb-1 min-w-[300px] rounded-panel shadow-modal">
  <div className="text-[12px] font-[var(--fw-medium)] uppercase tracking-widest px-3">
    PUBLIC
  </div>
</DropdownPanel>
```

This rule applies to **every** base component: `DropdownPanel`, `DropdownSection`, `DropdownItem`, `DropdownDivider`, `FooterDropdownTrigger`, `SidebarItem`, `IconButton`, `Chevron`, and all Radix wrappers in `dropdown-menu.tsx`.

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
| `.text-label` | 11px | 510 | 0.1em | 1.40 | Section headers, column headers (includes uppercase) |
| `.text-label-sm` | 11px | 510 | normal | 1.40 | Tiny labels |
| `.text-tiny` | 10px | 510 | -0.15px | 1.50 | Overline text |

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
| `.btn-primary` | White | Black | None | Primary CTAs (Create, Submit, Delete, Sign in) |
| `.btn-ghost` | `frost-02` | Secondary | Default | Standard actions, secondary CTAs, Cancel/Back |
| `.btn-subtle` | `frost-04` | Secondary | None | Toolbar actions, contextual |

### How to Use

All button variants share the same padding (`--space-2` / `--space-4`) and radius (`--radius-comfortable`) via the base class. No inline padding or radius overrides needed.

```jsx
<button className="btn-primary">Create</button>
<button className="btn-ghost">Cancel</button>
<button className="btn-subtle">Filter</button>
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
| `--icon-3xl` | 48px | Integration logos, feature icons |

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

## Dropdown Menu

All dropdown menus, popups, and floating panels **must** use the base components from `src/app/components/ui/`. For Radix-powered menus, the restyled primitives in `dropdown-menu.tsx` apply the same tokens automatically.

### Container (`DropdownPanel`)

File: `src/app/components/ui/DropdownPanel.tsx`

| Token | Class | Value | Use |
|-------|-------|-------|-----|
| Background | `bg-surface-panel` | `#0f1011` | Panel fill |
| Border | `border border-border-default` | `rgba(255,255,255,0.08)` | Container edge |
| Radius | `rounded-comfortable` | 6px | Corner rounding |
| Shadow | `shadow-elevated` | Floating elevation | Drop shadow |
| Vertical padding | `py-4` | 16px | Top/bottom space |
| Z-index | `z-50` | 50 | Stacking |

Positioning (`absolute`, `top-full`, `bottom-full`, `mt-1`, etc.) is applied via `className` by the consumer.

### Section Header (`DropdownSection`)

File: `src/app/components/ui/DropdownSection.tsx`

- Optional `label` prop renders uppercase header
- Typography: `.text-label` (includes uppercase + wide tracking — zero overrides)
- Color: `text-text-quaternary`
- Padding: `px-3`

### Menu Item (`DropdownItem`)

File: `src/app/components/ui/DropdownItem.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ReactNode` | — | Left icon (16px lucide) |
| `label` | `string` | — | Item text |
| `right` | `ReactNode` | — | Right element (toggle, check) |
| `onClick` | `function` | — | Click handler |
| `variant` | `'default' \| 'muted' \| 'destructive'` | `'default'` | Color scheme |

Layout: `flex items-center gap-2 px-3 py-1 text-caption-lg cursor-pointer transition-colors`

| Variant | Color | Hover |
|---------|-------|-------|
| `default` | `text-text-primary` | `text-text-primary` |
| `muted` | `text-text-tertiary` | `text-text-primary` |
| `destructive` | `text-status-error` | `text-status-error` |

Ghost style only — no background on hover.

### Divider (`DropdownDivider`)

File: `src/app/components/ui/DropdownDivider.tsx`

Renders `border-t border-border-subtle my-4`. Used between sections.

### Radix Integration

The Radix primitives in `dropdown-menu.tsx` (`DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`) use the same tokens. Consumers using Radix (`ProjectItemMenu`, `SortGroupControls`) inherit the styling automatically — no `className` overrides needed.

### Anti-patterns

- **Custom popup container styling** — use `DropdownPanel` or Radix `DropdownMenuContent`
- **`bg-surface-elevated`**, **`bg-surface-menu`**, **`rounded-panel`**, **`shadow-modal`** on dropdowns — use the standard tokens above
- **`hover:bg-*` on menu items** — ghost style only (color transitions, no background)
- **Inline font styles** (`text-[12px]`, `font-[var(--fw-medium)]`) in items — `DropdownItem` / `DropdownMenuItem` handle typography
- **Custom click-outside listeners** without `DropdownPanel` — consolidate into the base pattern

---

## Form Controls

All text inputs, textareas, and labeled form fields **must** use the base components from `src/app/components/ui/`. No inline input styling in consumer components.

### Text Input (`TextInput`)

File: `src/app/components/ui/TextInput.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Controlled value |
| `onChange` | `(value: string) => void` | — | Change handler (receives value, not event) |
| `placeholder` | `string` | — | Placeholder text |
| `type` | `'text' \| 'email' \| 'password' \| 'url'` | `'text'` | Input type |
| `hasError` | `boolean` | `false` | Error border state |
| `disabled` | `boolean` | `false` | Disabled state |
| `autoFocus` | `boolean` | — | Auto-focus on mount |
| `autoComplete` | `string` | — | Autocomplete attribute |
| `inputRef` | `React.Ref<HTMLInputElement>` | — | Ref forwarding |
| `onKeyDown` | `function` | — | Keyboard handler |
| `onFocus` | `function` | — | Focus handler |
| `onBlur` | `function` | — | Blur handler |

| Token | Class | Value | Use |
|-------|-------|-------|-----|
| Background | `bg-surface-panel` | `#0f1011` | Input fill |
| Border | `border border-border-default` | `rgba(255,255,255,0.08)` | Standard border |
| Radius | `rounded-comfortable` | 6px | Corner rounding |
| Padding | `p-3` | 12px | Internal spacing |
| Typography | `text-caption-lg text-text-primary` | 14px/510 | Input text |
| Placeholder | `placeholder:text-text-empty` | `#4a4e54` | Placeholder color |
| Focus | `focus:border-border-focus` | `rgba(255,255,255,0.2)` | Focus ring |
| Error | `border-status-error-border-focus` | — | Error state border |

### Text Area (`TextArea`)

File: `src/app/components/ui/TextArea.tsx`

Same token styling as `TextInput` plus `resize-none min-h-textarea` (100px minimum height). Props mirror `TextInput` except `textareaRef` replaces `inputRef` and there is no `type` prop.

### Form Field (`FormField`)

File: `src/app/components/ui/FormField.tsx`

Wraps a label, children (input/textarea/any content), and optional hint or error text.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Uppercase field label |
| `hint` | `ReactNode` | — | Helper text below field |
| `error` | `string \| null` | — | Error message (replaces hint when present) |
| `children` | `ReactNode` | — | Input or other content |

| Element | Token classes | Notes |
|---------|--------------|-------|
| Label | `text-label text-text-quaternary` | Preset includes uppercase + tracking |
| Hint | `text-label-sm text-text-quaternary` | Shown when no error |
| Error | `text-label-sm text-status-error` | Replaces hint |

### Action Row (`ActionRow`)

File: `src/app/components/ui/ActionRow.tsx`

Full-width action button with left icon and label. Used for import source buttons and similar row actions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ReactNode` | — | Left icon (16px lucide) |
| `label` | `string` | — | Button text |
| `onClick` | `function` | — | Click handler |
| `disabled` | `boolean` | `false` | Disabled state |

| Token | Class | Value | Use |
|-------|-------|-------|-----|
| Background | `bg-surface-elevated` | `#191a1b` | Row fill |
| Border | `border border-border-default` | Standard | Row edge |
| Radius | `rounded-comfortable` | 6px | Corner rounding |
| Typography | `text-btn text-text-tertiary` | 12px/510 | Label text |
| Hover | `hover:bg-surface-frost-04` | — | Hover state |

### Anti-patterns

- **Inline input classes** (`bg-surface-frost-02 border rounded-comfortable px-3 py-2.5 text-[14px]...`) — use `TextInput` or `TextArea`
- **Manual labels** (`<label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">`) — use `FormField`
- **Manual error/hint text** (`<p className="text-[12px] text-status-error">`) — use `FormField` error/hint props
- **`className` on form base components** — not accepted; use typed props

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
10. **No `className` prop on base components.** Consumer components pass typed props only. Base components own all visual styling. See "Base Component Architecture" section above.
11. **No typography preset overrides.** Never add `uppercase`, `tracking-*`, or `font-*` on top of a typography preset. `.text-label` already includes uppercase + wide tracking.
12. **No inline components.** Every component that renders JSX must live in its own file with a named export. No function components defined inside other components. No anonymous JSX blocks acting as components. No render helpers (`renderFoo()`) inside component bodies — extract them into standalone components that receive data via props. This applies everywhere: modals, sidebars, topbars, columns, pages, and layouts. A component file should import its children, never define them.

### Why Rule 12 matters

Inline components (functions that return JSX defined inside another component) cause:
- **Unnecessary re-renders** — React re-creates the function on every parent render, breaking referential equality and defeating memoization.
- **Hidden dependencies** — Closures over parent state create invisible coupling that is impossible to test or trace.
- **Untestable code** — Inline components cannot be imported, rendered, or asserted on independently.
- **Naming blindness** — React DevTools shows them as anonymous, making debugging harder.

**Example of what is forbidden:**

```tsx
// WRONG — breadcrumbs rendering is inline inside Topbar
export function Topbar() {
  const breadcrumbs = useMemo(() => [...], [deps]);
  return (
    <div>
      {breadcrumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} />}
          <span>{crumb}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
```

```tsx
// CORRECT — Breadcrumbs is its own component in its own file
// Breadcrumbs.tsx
export function Breadcrumbs() { ... }

// Topbar.tsx
import { Breadcrumbs } from './Breadcrumbs';
export function Topbar() {
  return (
    <div>
      <Breadcrumbs />
    </div>
  );
}
```

---

## Mini Demo Apps (MDA)

Mini demo apps are scaled-down interactive previews of the real application, used on the marketing site to demonstrate features. They live in `src/site/components/` and share a reusable component library at `src/site/components/mini-demo/`.

### Shared Component Library

All MDAs must compose from the shared building blocks in `mini-demo/`:

| Component | File | Purpose |
|-----------|------|---------|
| `MiniShell` | `MiniShell.tsx` | Outer container — rounded, bordered, shadow, fade-in transition |
| `MiniTopbar` | `MiniTopbar.tsx` | Topbar with PanelLeft, configurable breadcrumb segments, Settings icon |
| `MiniColumn` | `MiniColumn.tsx` | Column with header title, optional controls, configurable width |
| `MiniColumnEmpty` | `MiniColumn.tsx` | Empty state for columns (icon + message) |
| `MiniSidebar` | `MiniSidebar.tsx` | Sidebar with workspace picker, team sections, project tree, footer slot |
| `MiniSidebarFooterItem` | `MiniSidebarFooterItem.tsx` | Single integration footer item (icon, label, connected dot, value) |

Shared types (`MiniTeam`, `MiniProject`, `BreadcrumbSegment`) are in `mini-demo/types.ts`.

Card components (`DemoRequirementCard`, `DemoQuestionCard`, `DemoAnswerCard`) live in `app-demo/` but are imported by any demo that needs them.

### Rules

1. **No inline components.** Every MDA sub-element must be its own named component in its own file. No render helpers, no anonymous JSX blocks. This applies to cards, footers, sidebars, and all visual elements.

2. **Reuse shared components.** Never duplicate card, column, sidebar, or topbar rendering across demos. Import from `mini-demo/` or `app-demo/`.

3. **Scale radii proportionally.** The real app's radius tokens are too large at mini scale. Use proportionally reduced arbitrary values:

   | Real app token | Real value | MDA scale |
   |---|---|---|
   | `rounded-card` | 8px | `rounded-[4px]` |
   | `rounded-comfortable` | 6px | `rounded-[3px]` |
   | `rounded-standard` | 4px | `rounded-[2px]` |
   | `rounded-micro` | 2px | `rounded-[1px]` |
   | `rounded-full` | pill | `rounded-full` (unchanged) |

4. **Fixed font sizes.** MDA text uses explicit pixel sizes (`text-[6px]` through `text-[9px]`) rather than typography presets, which are designed for full-scale UI.

5. **Animation via `useSequence`.** All MDA animations use the shared `useSequence` hook from `app-demo/useSequence.ts`. Define a `SEQUENCE` array of `{ action, delay }` steps ending with `{ action: 'reset', delay: N }` to loop.

### Positioning in Feature Sections

MDAs placed inside `FeatureSection` must follow this pattern to work correctly across all viewport sizes:

**Container** (`FeatureSection` frame):
- Fixed height: `h-[680px]` — never changes between breakpoints
- `overflow-hidden relative` — clips the MDA when it extends beyond the container
- `bg-surface-frost-05` — visible frame background around the MDA

**MDA positioning** (`MiniShell` inside the frame):
- Fixed dimensions: e.g. `w-[800px] h-[600px]` — the MDA never resizes
- Fixed vertical offset: `top-[40px]` — equal frame visible on top and bottom (680 - 600 - 40 = 40)
- **Mobile** (`< md`): `left-[40px]` — locks the MDA in place, right side clips
- **Desktop/Tablet** (`md+`): `md:left-auto md:right-0` — flush to the right edge, left side clips when container is narrower than MDA

```tsx
// CORRECT — fixed size, responsive anchoring
<MiniShell className="absolute w-[800px] h-[600px] top-[40px] left-[40px] md:left-auto md:right-0">

// WRONG — percentage sizing, centering, dynamic calculations
<MiniShell className="w-[92%] h-[90%]">
<MiniShell className="absolute top-1/2 -translate-y-1/2">
<MiniShell style={{ left: 'max(40px, calc(100% - 800px))' }}>
```

**Key principles:**
- The MDA has a **fixed pixel size** that is identical at every viewport width
- Only the **visible portion** changes as the viewport shrinks
- The MDA **never moves** on mobile — it locks at `left-[40px]` and stays there
- On desktop it is **flush right** (`md:right-0`) with no frame on the right edge
- Frame is visible on **top, bottom, and left** (on desktop) or **top, bottom, and left** (on mobile, right clips)

### Hero Section MDA

The hero demo (`AppDemo`) uses a different pattern because it sits inside a Grainient background:
- `MiniShell` with `w-full h-full max-w-[1180px] min-w-[900px]`
- Parent container: `items-start justify-start lg:items-center lg:justify-center overflow-hidden`
- On mobile the left side stays visible, right clips due to `min-w-[900px]`

### Anti-patterns

- **Scaling the MDA** with percentage widths (`w-[92%]`) — use fixed pixel dimensions
- **Centering the MDA** with transforms (`translate-x/y`) — use fixed `top`/`left`/`right` offsets
- **Variable container heights** (`h-[360px] lg:h-full`) — use a single fixed height
- **Adding padding/rounding on the bleeding edge** — the edge where the MDA clips should have no padding
- **Inline `style={{}}` for positioning** — use Tailwind responsive classes (`md:right-0`)
- **Custom card/column components per demo** — reuse from `mini-demo/` and `app-demo/`

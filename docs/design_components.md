# Design Components

Component specifications for the Arvid codebase. These define how primitives from the [Design System](./design_system.md) are composed into reusable UI patterns.

All components consume tokens from `src/styles/theme.css` — never hardcode values.

---

## App Buttons

Used in the dashboard application (`src/app/`). Never on marketing pages.

### Variant Classes

| Class | Background | Text | Border | Use |
|-------|-----------|------|--------|-----|
| `.btn-primary` | White | Black | None | Primary CTAs (Create, Submit, Delete, Sign in) |
| `.btn-ghost` | `frost-02` | Secondary | Default | Standard actions, secondary CTAs, Cancel/Back |
| `.btn-subtle` | `frost-04` | Secondary | None | Toolbar actions, contextual |

All share: `--space-2` / `--space-4` padding, `--radius-comfortable` radius, `--fs-btn` (12px) text.

```jsx
<button className="btn-primary">Create</button>
<button className="btn-ghost">Cancel</button>
<button className="btn-subtle">Filter</button>
```

---

## Marketing Buttons

Marketing pages use exactly **3 variants × 3 sizes = 9 buttons**. No other buttons are allowed on marketing pages.

### Variants

| Class | Background | Text | Border | Hover |
|-------|-----------|------|--------|-------|
| `.site-btn-primary` | White (`--btn-primary-bg`) | Black (`--text-on-primary`) | None | `--btn-primary-hover` |
| `.site-btn-secondary` | `--surface-frost-10` | White (`--text-primary`) | None | `--surface-frost-15` |
| `.site-btn-outline` | Transparent | White (`--text-primary`) | `1px solid currentColor` | `--surface-frost-08` |

### Sizes

| Modifier | Font | Padding | Gap | Icon | Height | Use |
|----------|------|---------|-----|------|--------|-----|
| *(none, default)* | 12px (`--fs-btn`) | 8px 16px (`--space-2` / `--space-4`) | — | None | 31px | Nav buttons, small CTAs |
| `.site-btn-md` | 14px | 12px 16px (`--space-3` / `--space-4`) | 8px (`--space-2`) | 14px | 41px | Browse/utility buttons with icons |
| `.site-btn-lg` | 16px | 14px 24px (`14px` / `--space-6`) | 10px | 18px | 47px | Hero CTAs |

### Shared Properties

All 9 buttons share: `rounded-pill`, `font-weight: --fw-medium`, `line-height: 1.5`, `letter-spacing: normal`, `width: fit-content`, `transition: background-color 150ms`, `flex items-center justify-center`.

### Usage

```tsx
// Small — nav buttons (no icons, no size modifier)
<a className="site-btn-primary">Launch App</a>
<a className="site-btn-outline">Talk to Arvid</a>

// Medium — browse/utility buttons (14px icons)
<a className="site-btn-secondary site-btn-md">
  Browse all articles
  <ArrowUpRight size={14} />
</a>

// Large — hero CTAs (18px icons)
<a className="site-btn-primary site-btn-lg">
  Download for macOS
  <ArrowDownToLine size={18} />
</a>
```

### Icon Rules

- **Small**: No icons. Text only.
- **Medium**: Trailing icon at **14px**. Standard icon: `ArrowUpRight` from lucide.
- **Large**: Trailing icon at **18px**. Icons: `ArrowDownToLine` (download), `ArrowRight` (navigation).

### Where Each Size Is Used

| Size | Component | Examples |
|------|-----------|---------|
| Small | `TopNav` (desktop + mobile) | "Launch App", "Talk to Arvid", "Download" |
| Medium | `CtaSection`, sidebars, section footers | "Launch Arvid", "Browse all articles", "Copy link" |
| Large | `HeroSection` | "Download for macOS", "Explore Features" |

### Anti-patterns

- **Inline button classes** — use `.site-btn-*` classes, never `rounded-pill bg-white px-4 py-2 ...`
- **Mixing app and marketing variants** — app pages: `.btn-*`; marketing pages: `.site-btn-*`
- **Custom sizing** — only the 3 defined sizes are allowed
- **Icons on small buttons** — small buttons are text-only per spec
- **Wrong icon sizes** — medium=14px, large=18px, no exceptions
- **Animated icons on marketing buttons** — use standard lucide icons (not `@animate-ui/icons-*`)
- **A fourth variant** — only primary, secondary, and outline exist

---

## Links

All inline content links on marketing pages use `.link-default`.

| Property | Value |
|----------|-------|
| Color | `--text-primary` |
| Underline style | `dashed` |
| Underline color | `--border-default` → `--border-hover` on hover |
| Underline offset | 3px |
| Underline thickness | 1px |
| Transition | 150ms |

```tsx
<a href="/articles" className="text-caption link-default">Browse all articles</a>
```

### Anti-patterns

- `text-accent` on content links — accent is for UI controls
- Inline link styling — use `.link-default`
- No underline on content links — links must be distinguishable

---

## Page Layout (Marketing Site)

All marketing pages use `PageGrid` for every content section.

### Grid Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--grid-columns` | 12 | Column count |
| `--grid-gutter` | 16px → 20px → 24px | Responsive column gap |
| `--grid-margin` | 24px → 40px → 0px | Responsive inline padding |
| `--grid-max-width` | 1300px | Maximum content width |

### Responsive Behavior

| Breakpoint | Gutter | Margin | Width |
|------------|--------|--------|-------|
| Default (< 48rem) | 16px | 24px | Fluid |
| `md` (48rem+) | 20px | 40px | Fluid |
| `lg` (75rem+) | 20px | 0px | Capped 1300px |
| `xl` (90rem+) | 24px | 0px | Capped 1300px |

### Content Page Template (`ContentListPage`)

All marketing content pages use the shared `ContentListPage` template. It handles `TopNav`, `PageGrid`, title, optional panels, optional footer, and `CtaSection`.

| Prop | Type | Use |
|------|------|-----|
| `title` | `string` | Page heading |
| `subtitle` | `ReactNode?` | Metadata line below title |
| `leftPanel` | `ReactNode?` | Left sidebar (hidden below `lg`) |
| `rightPanel` | `ReactNode?` | Right sidebar (hidden below `lg`) |
| `footer` | `ReactNode?` | Section below main content |
| `children` | `ReactNode?` | Direct body content (detail pages) |
| `listProps` | `ListPatternProps?` | Fetch-and-render (list pages) |

### Anti-patterns

- Manual containers instead of `PageGrid`
- Building page chrome in page components — use `ContentListPage`
- `items-start` on panel row — must be `items-stretch`

### Article Typography (5 tokens)

All article/content pages use exactly 5 font tokens. No more, no less.

| # | Role | Description | Token |
|---|------|-------------|-------|
| 1 | Title | Main article heading | `text-h2` |
| 2 | Info | Date, author | `text-btn` + `text-text-tertiary` |
| 3 | Body text | Paragraphs, lists | `text-body` + `text-text-tertiary` |
| 4 | Body text titles | Same as Title | `text-h2` |
| 5 | Body text sub titles | Same as body but medium white | `text-body-md` |

---

## Article Components (Marketing Site)

Two article component sizes exist. All marketing grids and sections use one of these — no custom card rendering.

### Large — `FeatureSection`

Full-width strip with side-by-side text and demo area. Used on the landing page for hero features.

| Element | Token |
|---------|-------|
| Title | `text-h3` (20px semibold, primary) |
| Description | `text-body-lg` (18px regular, tertiary) |
| CTA button | `site-btn-primary site-btn-md` (optional) |
| Surface | `rounded-card bg-surface-panel` |
| Demo area | `h-[680px] bg-surface-frost-05` |

**Props:** `title`, `description`, `imagePosition` (`left` / `right`), optional `linkHref` + `linkLabel`, optional `children` (demo component).

**File:** `src/site/components/FeatureSection.tsx`

### Small — `ArticleCard`

Grid card used everywhere: `ProductFeaturesSection`, `LearnMoreSection`, all list pages (`ArticlesListPage`, `FeaturesListPage`, `GuidesListPage`, `DocsListPage`, `IntegrationsListPage`).

| Element | Token |
|---------|-------|
| Title | `text-caption-lg` (14px medium, primary) |
| Meta (date, author) | `text-btn` (12px medium, tertiary) |
| Excerpt | `text-caption-lg` (14px medium, tertiary) |
| Surface | `rounded-card bg-surface-panel px-6 py-10` |
| Demo area (featured) | `h-[300px] rounded-t-card bg-surface-frost-05` |

**Props:** `title`, `excerpt`, `slug`, optional `href` (overrides default `/articles/:slug`), optional `date`, `author`, `miniDemoId`, `variant` (`featured` / `compact`).

**File:** `src/site/components/article/ArticleCard.tsx`

### Anti-patterns

- Custom inline card rendering in section components — use `ArticleCard`
- Different typography tokens for the same card size
- Hardcoding `/articles/:slug` links — use the `href` prop when linking elsewhere

---

## Icon Button

All interactive icons use `<IconButton>` from `src/app/components/IconButton.tsx`.

| Prop | Type | Description |
|------|------|-------------|
| `onClick` | `(e: MouseEvent) => void` | Click handler |
| `title` | `string` | Tooltip text |
| `children` | `ReactNode` | Icon element (lucide) |

Behavior: `flex items-center justify-center`, `p-1`, ghost style (color transition only), icon `size={14}` (`--icon-sm`).

---

## Dropdown Menu

All dropdowns use base components from `src/app/components/ui/`.

### Container (`DropdownPanel`)

| Token | Value | Use |
|-------|-------|-----|
| Background | `bg-surface-panel` | Panel fill |
| Border | `border-border-default` | Container edge |
| Radius | `rounded-comfortable` | 6px |
| Shadow | `shadow-elevated` | Drop shadow |
| Padding | `py-4` | 16px vertical |

### Menu Item (`DropdownItem`)

| Variant | Color | Hover |
|---------|-------|-------|
| `default` | `text-text-primary` | `text-text-primary` |
| `muted` | `text-text-tertiary` | `text-text-primary` |
| `destructive` | `text-status-error` | `text-status-error` |

Ghost style only — no background on hover.

---

## Form Controls

### Text Input / Text Area

| Token | Value | Use |
|-------|-------|-----|
| Background | `bg-surface-panel` | Input fill |
| Border | `border-border-default` | Standard border |
| Radius | `rounded-comfortable` | 6px |
| Padding | `p-3` | 12px |
| Typography | `text-caption-lg` | 14px/510 |
| Focus | `border-border-focus` | Focus ring |

### Form Field

Label: `text-label text-text-quaternary`. Hint: `text-label-sm text-text-quaternary`. Error: `text-label-sm text-status-error` (replaces hint).

---

## Modal

All app modals use `BaseModal` from `src/app/components/BaseModal.tsx`.

| Token | Value |
|-------|-------|
| Background | `bg-surface-panel` |
| Border | `border-border-strong` |
| Radius | `rounded-panel` (12px) |
| Shadow | `shadow-modal` |
| Overlay | `bg-overlay-scrim` |

### Size Variants

| Variant | Width | Use |
|---------|-------|-----|
| `sm` | 400px | Confirmations, deletes |
| `md` | 480px | Single-field forms |
| `lg` | 520px | Multi-field forms |
| `wide` | 760px | Content-rich |
| `xl` | 70vw | Complex tabbed modals |

---

## Disclosure Chevron

Use `<Chevron>` from `src/app/components/Chevron.tsx`. Renders `ChevronRight` that rotates 90° when `open` is true. Color: `text-text-quaternary`.

| Context | Size |
|---------|------|
| Standard content areas | 14 (`--icon-sm`) |
| Compact tree items | 12 (`--icon-xs`) |

Never swap between `ChevronRight` and `ChevronDown` — the rotation handles state.

---

## Mini Demo Apps (MDA)

Scaled-down interactive previews on the marketing site. Two systems sharing shared primitives:

| | MDA | DMC |
|--|---|---|
| Purpose | Full app window demo for landing page | Focused feature demo for articles |
| Engine | `useDemoEngine` | `useDmcEngine<S, P>` |
| Container | Absolute-positioned in feature sections | Fixed-height (`aspect-square`) |

### Key Rules

1. All MDAs compose from `mini-demo/` shared components (`MiniShell`, `MiniTopbar`, `MiniColumn`, `MiniSidebar`)
2. DMC containers must have stable size (`aspect-square`) to prevent layout shift
3. DMC components must NOT set their own background — parent provides `bg-surface-frost-05`
4. Animation timing: MDA cycles 20-30s, DMC cycles 14-20s
5. CSS transitions: only `duration-300`, `duration-500`, `duration-700`
6. Demo-scale text: `text-[9px]` titles, `text-[8px]` body, `text-[7px]` metadata, `text-[6px]` micro

### MDA Positioning in Feature Sections

- Container: `h-[680px] overflow-hidden relative bg-surface-frost-05`
- MiniShell: fixed size (e.g. `w-[800px] h-[600px]`), `top-[40px]`, mobile `left-[40px]`, desktop `md:right-0`

### Anti-patterns

- Percentage widths on MDAs — use fixed pixel dimensions
- Centering with transforms — use fixed offsets
- DMC container without stable size
- DMC with own background color
- Conditional rendering at top level of DMC — use opacity crossfades

---

## Hint Animation

Non-destructive visual nudge using transform only.

| Property | Value |
|----------|-------|
| Class | `.card-hint` |
| Duration | 0.8s |
| Peak scale | 1.015 at 40% |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` |

No border, shadow, or color changes — transform only.

---

## Empty State Suggestions

Maximum **5 suggestions** shown, ranked by relevance. Uses `SuggestionAction` component. The Arvid logo (pinwheel) sits above the list as brand anchor.

Suggestions reflect actionable next steps based on project state (requirements count, integration status, etc.). Target implementation: LLM-driven ranking.

# Mini Demo Components

This document is the **enforceable specification** for all animated mini demo components on the marketing site.
Every demo must be a visual replica of the real app. If it doesn't look like the product, it doesn't ship.

For **creative direction** (narrative arc, motion language, pacing, multi-demo coherence), see [docs/mda_director.md](mda_director.md).

---

## Mandatory Workflow

Creating or redesigning any MDA follows a three-stage pipeline. Stages cannot be skipped.

| Stage | Skill | Output | What happens |
|-------|-------|--------|--------------|
| 1. Direct | `mda-director` | Director's Treatment | Define mood, cast, viewer takeaway, phase breakdown, beat sheet. No code. |
| 2. Script | `mda-scriptwriter` | `data.ts` | Translate treatment into SEQUENCE, collaborators, cursor positions, static content. No components. |
| 3. Build | (manual) | Components + orchestrator | Implement using shared primitives from `mini-demo/`. |

If the narrative changes after implementation, go back to stage 1 — never patch code on top of a stale script.

---

## Purpose and Principles

- Demos are visual replicas of real app features — they must look identical to the actual product.
- They exist to show prospective users exactly what the app does, not an approximation.
- Every surface, text style, border, and status color must use the same design tokens as the real app.
- If the real app changes, the demo must reflect those changes.
- Demos are marketing tools, not prototypes. They sell by showing truth.

---

## Module Architecture

Every demo lives in its own folder under `src/site/components/`:

```
src/site/components/<feature-name>-demo/
├── index.ts              — barrel export
├── data.ts               — sequence definition + static content
├── <ComponentA>.tsx      — sub-component (named for what it represents)
├── <ComponentB>.tsx      — sub-component
└── <FeatureName>Demo.tsx — thin orchestrator
```

### Rules

| Rule | Rationale |
|------|-----------|
| Shared animation hook lives at `src/site/components/mini-demo/useSequence.ts` — always import from there | Single source of truth for animation logic |
| Types (`Step`) come from `src/site/components/mini-demo/types.ts` | Consistent interface across all demos |
| Shared card primitives live in `src/site/components/mini-demo/MiniCard.tsx` | Reusable card shell, header, meta, chips, connectors |
| No inline component definitions | Master rules: every component gets its own file |
| No animation logic in component files | Separation of concerns: components render, data.ts orchestrates |
| Data and timing live exclusively in `data.ts` | One place to adjust all behavior |
| Orchestrator is a thin wiring layer only | Derives booleans from sequence state, passes as props |

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Folder | `<feature>-demo/` (kebab-case) | `github-demo/`, `slack-demo/` |
| Orchestrator | `<Feature>Demo.tsx` (PascalCase) | `GitHubDemo.tsx`, `SlackDemo.tsx` |
| Sub-components | Named for what they represent in the demo's narrative | `RequirementCard.tsx`, `ProjectSidebar.tsx`, `KnowledgeSummary.tsx` |
| Data exports | `SEQUENCE` for the animation chain, `ALL_CAPS` for static data | `SEQUENCE`, `REPOS`, `REQUIREMENTS` |

**Forbidden names:** Generic labels like `DemoSidebar`, `DemoPanel`, `DemoCard`, `DemoList`. Name components for their role in the feature story.

---

## Animation Timing

All demos use the sequential chain model via `useSequence`:

```ts
import { useSequence } from '../mini-demo';
import type { Step } from '../mini-demo';

export const SEQUENCE: Step[] = [
  { action: 'show_shell', delay: 0 },
  { action: 'next_thing', delay: 600 },
  // ...
  { action: 'reset', delay: 2500 },
];
```

The `useSequence` hook supports:
- **Viewport-aware playback** — pauses when scrolled out of view (requires passing a container `ref`)
- **Tab visibility** — pauses when the browser tab is hidden
- **`prefers-reduced-motion`** — skips to final state when user prefers reduced motion
- **`currentIndex`** — exposed alongside the `has()` method for phase-based derivation

Each step has a **relative delay** — how long to wait before it fires. Changing one value has zero effect on other steps.

### Standard Timing Guidelines

Demos must feel **slow, ambient, and continuous**. See `docs/mda_director.md` for the full pacing philosophy.

| Category | Delay Range | When to Use |
|----------|-------------|-------------|
| Shell appear | `0ms` | First step, always instant |
| Initial reveals | `800–1200ms` | Elements fading/sliding in |
| User-simulated actions | `1000–1400ms` | Clicks, selections, navigations |
| Content loading / fetch | `1400–2000ms` | Simulating network requests |
| Reading pause | `2000–3000ms` | Let viewer absorb what happened |
| Drift hold | `3000–4000ms` | Still frame before the cycle loops |

### Constraints

- Total cycle duration: **20–30 seconds** (target), **18 seconds** hard minimum
- Demos must **loop seamlessly** — the viewer should never perceive a restart
- CSS transitions use Tailwind duration classes:
  - `duration-300` — micro transitions (color, opacity on hover-like state)
  - `duration-500` — standard transitions (cards appearing, state changes)
  - `duration-700` — major reveals (shell appearing, progress bar fills, fade-outs)
- No other `duration-*` values are permitted
- The `reset` action clears all state and restarts from step 0 — the seamless feel comes from **slow transitions during Drift, not from avoiding reset**

---

## Styling Rules (Visual Fidelity)

### Token Usage

All visual values come from `src/styles/theme.css`. No exceptions.

| Concern | Correct | Forbidden |
|---------|---------|-----------|
| Surfaces | `bg-surface-panel`, `bg-surface-frost-*` | `bg-gray-900`, `bg-[#0f1011]` |
| Text colors | `text-text-primary`, `text-text-tertiary` | `text-white`, `text-gray-400` |
| Font weights | `font-[var(--fw-medium)]`, `font-[var(--fw-regular)]` | `font-medium`, `font-[500]` |
| Status colors | `bg-status-success`, `text-status-error` | `bg-green-500`, `text-red-500` |
| Borders | `border-border-subtle`, `border-border-default` | `border-gray-800`, `border-white/10` |
| Radius | `rounded-standard`, `rounded-micro`, `rounded-card` | `rounded-lg`, `rounded-[8px]`, `rounded-[3px]` |

### Demo-Specific Scaling

Since demos render at miniature scale inside feature sections, text sizes are scaled down:

| Role | Size |
|------|------|
| Section headers (uppercase labels) | `text-[8px]` |
| Card titles, primary content | `text-[9px]` |
| Secondary content, metadata | `text-[8px]` |
| Micro labels, badges, tags | `text-[6px]`–`text-[7px]` |

### Layout Fidelity

- The real app's column structure (sidebar + multi-panel layout) must be proportionally correct.
- Use fractional widths (`w-1/4`, `w-1/2`) that match the real app's panel ratios.
- The demo shell uses `rounded-standard`, `border border-border-subtle`, `bg-surface-base`, `shadow-elevated`.

---

## Shared Primitives

All demos should use the shared primitives from `src/site/components/mini-demo/`:

| Primitive | Purpose |
|-----------|---------|
| `MiniCard` | Card shell with visibility, emphasis, dimming, variant (default/suggested), connectors |
| `MiniCardHeader` | Monospace short-id row with optional trailing slot |
| `MiniCardTitle` | Demo-scale title with correct typography (`text-[9px]`) |
| `MiniCardMeta` | Author-date footer with indicator dot slots |
| `MiniIndicatorDot` | `w-1.5 h-1.5` semantic color dot |
| `MiniStatusChip` | Dashed chip with icon + label |
| `MiniColumnConnector` | Focus line connecting columns (`left` / `right`) |
| `MiniColumnHeader` | Column header strip (reused by `MiniColumn` and standalone panels) |
| `MiniShell` | Outer demo frame with scale/fade entrance |
| `MiniColumn` | Column with header + scrollable body |
| `MiniSidebar` | Sidebar with workspace picker + team/project tree |

---

## Content Rules

- Demo data must represent realistic use cases for the feature being shown.
- Text must be meaningful — no "lorem ipsum", no placeholder gibberish.
- User names, project names, and categories should feel like a real team using the product.
- If the feature involves AI suggestions, show the actual pattern: suggestion card → accept/reject → promoted card.
- Requirements, questions, and answers should be technically plausible for a software team.

---

## Checklist for New Demos

Before shipping any new mini demo, verify:

- [ ] Uses `useSequence` from `src/site/components/mini-demo/useSequence.ts`
- [ ] Uses shared card primitives (`MiniCard`, `MiniCardHeader`, etc.)
- [ ] Passes a container `ref` to `useSequence` for viewport-aware playback
- [ ] Module folder with barrel `index.ts` export
- [ ] Sub-components in their own files with contextual names
- [ ] All timing defined in `data.ts`, nothing hardcoded in component files
- [ ] Visual tokens match the real app exactly (no hardcoded colors/weights/radii)
- [ ] Only `duration-300` / `duration-500` / `duration-700` transition classes
- [ ] Animation feels **slow, ambient, and unhurried**
- [ ] Loop is **seamless** — no visible restart point
- [ ] Content is realistic and demonstrates the actual feature value
- [ ] Component names describe their role in the feature narrative
- [ ] Total cycle is 20–30 seconds
- [ ] Passes the Director Rulebook checklist ([docs/mda_director.md](mda_director.md))

---

## Reference Implementations

| Demo | Location | Shows |
|------|----------|-------|
| Hero app demo | `src/site/components/app-demo/` | Full product overview with 4-column flow |
| GitHub code context | `src/site/components/github-demo/` | Connecting a repo and getting AI-enhanced requirements |

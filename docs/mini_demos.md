# Mini Demo Components

This document is the **enforceable specification** for all animated mini demo components on the marketing site.
Every demo must be a visual replica of the real app. If it doesn't look like the product, it doesn't ship.

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
| Shared animation hook lives at `src/site/components/app-demo/useSequence.ts` — always import from there | Single source of truth for animation logic |
| Types (`Step`) come from `src/site/components/app-demo/types.ts` | Consistent interface across all demos |
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
| Sub-components | Named for what they represent in the demo's narrative | `RepoConnector.tsx`, `EnhancedRequirements.tsx`, `SuggestedQuestions.tsx` |
| Data exports | `SEQUENCE` for the animation chain, `ALL_CAPS` for static data | `SEQUENCE`, `REPOS`, `REQUIREMENTS` |

**Forbidden names:** Generic labels like `DemoSidebar`, `DemoPanel`, `DemoCard`, `DemoList`. Name components for their role in the feature story.

---

## Animation Timing

All demos use the sequential chain model via `useSequence`:

```ts
import { useSequence } from '../app-demo/useSequence';
import type { Step } from '../app-demo/types';

export const SEQUENCE: Step[] = [
  { action: 'show_shell', delay: 0 },
  { action: 'next_thing', delay: 600 },
  // ...
  { action: 'reset', delay: 2500 },
];
```

Each step has a **relative delay** — how long to wait before it fires. Changing one value has zero effect on other steps.

### Standard Timing Guidelines

| Category | Delay Range | When to Use |
|----------|-------------|-------------|
| Shell appear | `0ms` | First step, always instant |
| Initial reveals | `400–800ms` | Elements fading/sliding in |
| User-simulated actions | `600–1000ms` | Clicks, selections, navigations |
| Content loading / fetch | `1200–1600ms` | Simulating network requests |
| Reading pause | `1600–2500ms` | Let user absorb what happened |
| Reset delay | `2000–3000ms` | Pause before the loop restarts |

### Constraints

- Total loop duration: **12–18 seconds** (long enough to read, short enough to not bore)
- CSS transitions use Tailwind duration classes:
  - `duration-300` — micro transitions (color, opacity on hover-like state)
  - `duration-500` — standard transitions (cards appearing, state changes)
  - `duration-700` — major reveals (shell appearing, large layout shifts)
- The `reset` action clears all state and restarts from step 0 — no explicit loop duration needed

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
| Radius | `rounded-card`, `rounded-comfortable` | `rounded-lg`, `rounded-[8px]` |

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
- The demo shell uses `rounded-lg`, `border border-border-subtle`, `bg-surface-base`, `shadow-elevated` — matching the real app's window chrome.

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

- [ ] Uses `useSequence` from `src/site/components/app-demo/useSequence.ts`
- [ ] Module folder with barrel `index.ts` export
- [ ] Sub-components in their own files with contextual names
- [ ] All timing defined in `data.ts`, nothing hardcoded in component files
- [ ] Visual tokens match the real app exactly (no hardcoded colors/weights)
- [ ] Animation feels natural (not too fast, not too slow)
- [ ] Loop resets cleanly without visual jank
- [ ] Content is realistic and demonstrates the actual feature value
- [ ] Component names describe their role in the feature narrative
- [ ] Total loop is 12–18 seconds

---

## Reference Implementations

| Demo | Location | Shows |
|------|----------|-------|
| Hero app demo | `src/site/components/app-demo/` | Full product overview with 4-column flow |
| GitHub code context | `src/site/components/github-demo/` | Connecting a repo and getting AI-enhanced requirements |

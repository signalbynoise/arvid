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

## MiniShell Positioning — CRITICAL ARCHITECTURE RULE

`MiniShell` (`src/site/components/mini-demo/MiniShell.tsx`) uses a **two-div structure** that must not be modified without understanding the constraint:

### The Problem

Each demo's `layout.shell.className` sets `position: absolute` to anchor the demo shell within its container (e.g. `absolute w-[800px] h-[600px] top-[40px] right-0`). Meanwhile, `MiniModal` uses `absolute inset-0` to scope its dark overlay scrim to the app shell frame.

For modal scoping to work, `MiniModal` needs a parent with `position: relative`. The intuitive fix is adding `relative` to the `MiniShell` div. **This is wrong and breaks everything.**

### Why `relative` on the outer div breaks positioning

In Tailwind v4 (and CSS generally), when two utility classes set the same property (`position`) on the same element, the winner is determined by **stylesheet generation order**, not by the order in the `class` attribute. When `relative` and `absolute` coexist on the same element:

```
className={`relative flex ... ${className}`}
//          ^^^^^^^^              ^^^^^^^^
//          sets position:relative  sets position:absolute
```

Tailwind may generate `position: relative` **after** `position: absolute` in the stylesheet, causing `relative` to silently win. The shell stops being absolutely positioned. The hero demo floats instead of anchoring to the bottom. Side demos ignore `right-0` and `left-0`. No amount of `!important` hacks or class reordering fixes it because the conflict is at the stylesheet level.

### The Solution: Two-Div Structure

```
Outer div — receives className (with `absolute`, sizing, positioning)
  └── Inner div — `relative flex flex-1 min-w-0 min-h-0`
        └── children (sidebar, columns, MiniModal)
```

- **Outer div**: positioned by the demo config. MUST NOT have `relative`.
- **Inner div**: provides `position: relative` for modal scoping. MUST NOT be removed.

### Rules

- **NEVER** add `relative`, `fixed`, or `sticky` to `MiniShell`'s outer div
- **NEVER** remove the inner `relative` wrapper div
- **NEVER** put two conflicting position utilities on the same element in any shared primitive
- If you need a new positioning context, add it **inside** the inner div

This was a multi-hour debugging incident. The root cause was invisible in DevTools because the class attribute showed both `relative` and `absolute` — but CSS resolved the conflict silently based on stylesheet order.

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
- [ ] `MiniShell` outer div has NO `relative`/`fixed`/`sticky` — only the inner wrapper has `relative` (see § "MiniShell Positioning")

---

## Demo Mini Components (DMCs)

DMCs are a **smaller variant** of the full MDA system. They follow the same headless rule-based principles but are scoped to a single feature, not the full app.

### When to use MDA vs DMC

| | MDA (Mini Demo Animation) | DMC (Demo Mini Component) |
|--|---------------------------|--------------------------|
| **Shows** | Full app window with sidebar, topbar, multi-column layout | A focused interaction for one feature |
| **Shell** | `MiniShell` with `DemoShellView` orchestrator | No `MiniShell` — lightweight custom orchestrator |
| **Engine** | `useDemoEngine` with `DemoState` | `useDmcEngine<S, P>` with custom state type |
| **State** | Shared `DemoState` (14 fields, all demos) | Per-DMC state type (only fields that feature needs) |
| **Container** | Absolute-positioned shell inside a `bg-surface-frost-05` panel | **Fixed-height** container (no layout shift) |
| **Primary use** | Landing page hero + feature sections | Article pages — one DMC per article topic |
| **Cycle length** | 20-30s | 14-20s |

### DMC Architecture

DMCs use the **generic engine** (`useDmcEngine`) from `src/site/components/mini-demo/useDmcEngine.ts`. It is identical to `useDemoEngine` but type-parameterized over any state shape `S` and content pool `P`.

```
src/site/components/<feature>-dmc/
├── index.ts              — barrel export
├── direction.ts          — state type, rules, content pool, goal, resetCycle
├── <ComponentA>.tsx      — visual sub-component
├── <ComponentB>.tsx      — visual sub-component
└── <Feature>Dmc.tsx      — orchestrator (maps engine state to visuals)
```

Generic types live in `src/site/components/mini-demo/dmc-types.ts`:
- `DmcDirection<S, P>` — goal, rules, actors, contentPool, initialState, resetCycle, tickDelay, tickJitter, startDelay
- `DmcRule<S, P>` — actor, weight, canExecute, execute
- `DmcTransition<S>` — actor, verb, subject, stateUpdate
- `DmcEngineOutput<S>` — state, currentTransition, activeActor

### DMC Container Rules — CRITICAL

DMCs render inside article pages and article cards. Their container **must have a stable size** to prevent layout shift as elements animate in and out. Use `aspect-square` for a square container that fills the parent width.

```tsx
// CORRECT — aspect-ratio square, no bg (parent provides frost bg)
<div ref={containerRef} data-cursor-boundary="my-dmc" className="relative aspect-square">
  {/* crossfading layers with absolute positioning */}
</div>

// WRONG — auto height causes layout shift when content changes
<div ref={containerRef} className="relative">
  {state.showCard && <MyCard />}
  {state.showModal && <MyModal />}
</div>
```

Pattern: use **two absolute layers** inside the container with **percentage-based sizing** so content scales with the container:

```tsx
<div className="relative aspect-square">
  <div className={`absolute inset-0 flex items-center justify-center p-[12%] transition-all duration-500 ${showA ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
    <div className="w-full max-w-[75%]">
      <CardComponent />
    </div>
  </div>
  <div className={`absolute inset-0 flex items-center justify-center p-[10%] transition-all duration-500 ${showB ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
    <div className="w-full max-w-[85%]">
      <ModalComponent />
    </div>
  </div>
</div>
```

**Responsive sizing rules:**
- Padding: use percentage `p-[10%]` or `p-[12%]`, never fixed pixel padding like `p-6`
- Card width: `max-w-[75%]` of container
- Modal width: `max-w-[85%]` of container (modals show more content than cards)
- **Never** use fixed pixel widths like `max-w-[220px]` or `max-w-[300px]` — these become tiny in large containers and don't scale

### DMC Direction

DMC directions follow the same pattern as MDA directions but with two additions:

- **`initialState`** is required (no shared default state)
- **`resetCycle`** is an explicit function (no hardcoded `startNewCycle`)

```typescript
export const myDirection: DmcDirection<MyState, MyPool> = {
  goal: (s) => s.step === 'done',
  actors: [ARVID],
  rules: [...],
  contentPool: { ... },
  initialState: { step: 'idle', ... },
  resetCycle: (state) => ({ ...INITIAL, cycleCount: state.cycleCount + 1 }),
  tickDelay: 1000,  // base delay between ticks, default 1000ms
  tickJitter: 400,  // random ± variance per tick, default 400ms
  startDelay: 2000, // max random offset before first tick, default 2000ms
};
```

### DMC Organic Timing

DMCs must feel **organic and non-mechanical**. Multiple DMCs on the same page must never beat in unison.

The engine enforces this via three timing controls:

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `tickDelay` | `1000` ms | Base delay between ticks |
| `tickJitter` | `400` ms | Random ±variance added to each tick (`delay ± jitter`) |
| `startDelay` | `2000` ms | Max random offset before the first tick fires |

**Why this matters:** Without jitter, two DMCs on the articles list page tick at the exact same cadence — transitions fire simultaneously, cursors move in lockstep, and the demos feel robotic. The random start offset desynchronizes them, and per-tick jitter ensures they stay desynchronized across cycles.

**Rules:**
- Every DMC inherits default jitter — no configuration needed for organic feel
- DMCs that share a page should use **different `tickDelay`** values (e.g. 1000 vs 1100) for additional desync
- Jitter should be at least 30% of `tickDelay` for noticeable variation

### DMC Actor Diversity

DMCs must use **contextually appropriate actors**, not always "Arvid":

- If the demo shows a **human action** (clicking a button, inspecting a card), use a human actor (Sarah K., David M., Erik L.)
- If the demo shows **AI analysis** (scanning, evaluating, generating), use Arvid
- Different DMCs on the same page should use **different actor names** to avoid the impression of a single bot driving everything

### DMC Shared Components

DMCs reuse the same `mini-demo/` primitives as MDAs (MiniCard, MiniCursor, MiniProgressBar, etc.). They also share the `RequirementCard` from `app-demo/` for any demo that shows a requirement.

The `RequirementCard` is the **canonical requirement card for all demos** (MDA and DMC). It renders:
- Short ID + ellipsis menu icon
- Title
- Chips row: completeness %, optional status chip, optional impl status chip
- Footer: owner + date + indicator dots

When a DMC needs cursor targeting on a specific chip (e.g. the implementation status chip), pass `implChipTarget` to set the `data-cursor-target`.

### DMC Checklist

- [ ] Uses `useDmcEngine` from `mini-demo/useDmcEngine.ts`
- [ ] Direction has explicit `initialState` and `resetCycle`
- [ ] Container has **stable size** (use `aspect-square`) — NO auto-sizing
- [ ] Uses absolute-positioned crossfade layers — no conditional rendering that shifts layout
- [ ] Container has **no background** — parent provides `bg-surface-frost-05`
- [ ] Reuses shared primitives and `RequirementCard` where applicable
- [ ] Registered in `src/site/lib/mdaRegistry.ts` with a descriptive label
- [ ] Content pool has 3+ scenarios for varied cycles
- [ ] Actor is contextually appropriate (human for clicks, Arvid for AI analysis)
- [ ] `tickDelay` differs from other DMCs that may share a page
- [ ] `tickJitter` is not zero (organic timing)

---

## Article Integration

### Article Page (`ArticlePage.tsx`)

When an article has `mini_demo_id`, the MDA/DMC renders at the top of the article body inside a container with `bg-surface-frost-05` and `rounded-card`:

```tsx
<div className="overflow-hidden rounded-card bg-surface-frost-05">
  <Suspense fallback={...}>
    <MdaComponent />
  </Suspense>
</div>
```

The **`bg-surface-frost-05`** background is mandatory — it matches the landing page feature section containers. DMC components must NOT set their own background (they should be transparent so the frost bg shows through).

### Article Card (`ArticleCard.tsx`)

Article cards in list views (`ArticlesListPage`, `LearnMoreSection`, `ArticleReadMore`) also render the mini demo when:
- The article has a `mini_demo_id`
- The card variant is `featured`

The card lazy-loads the component from `MDA_REGISTRY` with the same frost background. Callers must pass `miniDemoId={article.mini_demo_id}` to `ArticleCard`.

### Registry (`mdaRegistry.ts`)

All MDAs and DMCs must be registered in `src/site/lib/mdaRegistry.ts`:

```typescript
'my-feature-dmc': {
  label: 'My Feature Name',
  component: lazy(() => import('../components/my-feature-dmc').then((m) => ({ default: m.MyFeatureDmc }))),
},
```

The `label` appears in the CMS admin article form as a dropdown option. The `id` key is stored as `mini_demo_id` on the article.

---

## Reference Implementations

| Demo | Type | Location | Shows |
|------|------|----------|-------|
| Hero app demo | MDA | `src/site/components/app-demo/` | Full product overview with 4-column flow |
| GitHub code context | MDA | `src/site/components/github-demo/` | Connecting a repo and getting AI-enhanced requirements |
| Accordance Score | DMC | `src/site/components/accordance-dmc/` | Requirement card → impl modal with score animation |

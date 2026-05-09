# MDA Director Rulebook

This document is the **creative direction spec** for all Mini Demo Animations (MDAs) on the marketing site.
It governs the narrative, motion, pacing, and visual coherence that make every demo feel like it was directed by the same person.

`docs/mini_demos.md` covers **engineering mechanics**. This document covers **feel**.

This rulebook is enforced by two Cursor agent skills:
- **`mda-director`** — produces the Director's Treatment (mood, cast, beats, phases)
- **`mda-scriptwriter`** — translates the treatment into `data.ts` (timing, cursors, content)

---

## Core Philosophy: Continuous, Not Intrusive

MDAs are **ambient**. They are not presentations with a beginning and an end — they are living, breathing windows into the product that happen to be on the page. The viewer should never feel like they are "watching something start" or "waiting for something to finish."

**Guiding principles:**

- **Seamless loops.** There is no visible reset. The transition from the end of one cycle to the beginning of the next must be invisible. The viewer should feel like the demo has been running forever and will continue forever.
- **Slow and deliberate.** Every movement is unhurried. Demos are background texture, not foreground entertainment. If a demo feels like it is demanding attention, it is too fast.
- **Ambient presence.** A demo should feel like glancing through a window at a team using the product — not like watching a scripted tutorial. The pace should match someone calmly working, not someone performing.

---

## Narrative Cycle

MDAs do not tell linear stories. They cycle through **phases** that blend into each other. There is no "Act 1" — a viewer can start watching at any moment and it should feel natural.

| Phase | Purpose | Time Budget | What Happens |
|-------|---------|-------------|--------------|
| **Settle** | Establish spatial context | 10-15% of cycle | Shell and structure are visible, environment is calm |
| **Flow** | Demonstrate the feature working | 55-65% of cycle | Elements appear slowly, selections happen, AI suggestions arrive one by one |
| **Resolve** | Show the value delivered | 15-20% of cycle | Completeness rises, answers appear, connections form |
| **Drift** | Hold the completed state | 10-15% of cycle | Everything is still. The viewer absorbs. Then elements gently fade away to restart. |

### Rules

- **No abrupt resets.** The Drift phase must gently transition elements away (fade out, not snap) before the Settle phase reintroduces them. The viewer should not be able to identify the exact moment the loop restarts.
- The **Settle** phase should feel like "things are already here" — not like "things are appearing for the first time."
- The **Flow** phase must be slow and steady. Long pauses between steps. No rapid-fire sequences.
- The **Resolve** phase should feel like a natural consequence of the Flow, not a dramatic climax.
- The **Drift** is genuine stillness followed by a gentle dissolve — not a sudden clearing of the screen.

---

## Motion Language

All MDAs share a single motion vocabulary. No custom animations, no one-off transitions.

### Entrance Patterns

| Element Type | Entrance | Duration |
|-------------|----------|----------|
| Shell (outer frame) | Scale up + fade in (`scale-95 opacity-0` to `scale-100 opacity-100`) | `duration-700` |
| Cards (requirements, questions, answers) | Slide up + fade in (`translate-y-2 opacity-0` to `translate-y-0 opacity-100`) | `duration-500` |
| Suggested cards (AI-generated) | Slide up + partial fade (`translate-y-2 opacity-0` to `translate-y-0 opacity-70`) | `duration-500` |
| Sidebar tree expansion | Height reveal (children appear) | `duration-500` |
| Footer / integration rows | Slide up + fade in (same as cards) | `duration-500` |

### State Changes

| Change | Motion |
|--------|--------|
| Selection (card becomes active) | Instant surface swap: `bg-surface-elevated` to `bg-surface-frost-03`. No position change. | 
| Deselection / dimming | Instant opacity reduction: `opacity-30 saturate-50` |
| Connector lines | Appear with selected state (no independent animation) |
| Progress bars | `duration-700 ease-out` for the bar fill |

### Exit Patterns

Elements must exit gracefully to support seamless looping. Exits happen during the Drift phase.

| Element Type | Exit | Duration |
|-------------|------|----------|
| Cards and content | Fade out in place (`opacity-100` to `opacity-0`). No slide. | `duration-700` |
| Shell (outer frame) | Stays visible across loop boundaries. Never exits. | N/A |
| Sidebar and topbar | Stay visible across loop boundaries. Content within may reset. | N/A |

### Forbidden Motion

- No horizontal slides (left/right translate)
- No rotation or skew
- No spring/bounce easing
- No staggered delays within a single card (all parts of a card appear together)
- No abrupt disappearance — elements that need to leave must fade out slowly
- No visible "clearing" of the screen between loops

### Duration Tiers

Only three transition durations exist:

| Tier | Value | Use |
|------|-------|-----|
| Micro | `duration-300` | Chip color changes, dot appearances, hover-like states |
| Standard | `duration-500` | Card entrances, panel reveals, state changes |
| Major | `duration-700` | Shell appearance, progress bar fills, full-section reveals |

No other `duration-*` values are permitted in MDA components.

### Easing

- Default CSS `ease` for all transitions (Tailwind default)
- `ease-out` only for progress/completeness bars
- No `ease-in`, no `ease-in-out`, no custom `cubic-bezier`

---

## Attention Direction

### Column Flow

- Viewer attention follows **left-to-right** column order
- Within a column, attention flows **top-to-bottom**
- Only **one column** should have active motion at any moment
- The sequence must respect this: finish animating column N before starting column N+1

### Focus Mechanics

- **Selected state** + **connector lines** create the visual thread between columns
- **Dimming** (`opacity-30 saturate-50`) on non-active siblings focuses attention on the selected item
- **Suggested cards** at `opacity-70` with dashed borders signal "pending action" without stealing focus

### Hierarchy

At any moment, the viewer should be able to answer: "What am I supposed to look at?"

Priority order:
1. The element that just appeared (entrance animation draws the eye)
2. The selected/emphasized element (bright surface + connector)
3. The active column header (context for what is happening)
4. Everything else (dimmed, static, background)

---

## Pacing

### The Golden Rule: Slower Than You Think

If a demo feels "about right" during development, it is too fast. Slow it down by 30%. MDAs compete with nothing — there is no user waiting for them to finish. They are ambient. Lean into that.

### Timing Rules

| Rule | Value |
|------|-------|
| Minimum gap between visible state changes | 800ms |
| Typical gap during Flow phase | 1000–1400ms |
| Reading pause after Resolve | 2000–3000ms |
| Drift hold (still frame before fade-out) | 3000–4000ms |
| Target total cycle | 20–30s |
| Hard minimum cycle | 18s |

### Rhythm

- The Flow phase should have a **lazy, unhurried cadence** — generous pauses between steps, like watching someone work at a calm pace
- The Resolve phase should feel like a **natural settling**, not a dramatic reveal
- The Drift phase must be **long and still** — the viewer should have time to read everything on screen, look away, and look back
- The transition from Drift back to Settle should be **imperceptible** — a slow fade, not a snap

### Reveal Pacing

- Elements in the same column should appear with generous spacing (800–1200ms apart)
- Cross-column transitions need significant breathing room (1200–1800ms)
- AI suggestion sequences should feel thoughtful: suggest, long pause, accept, long pause, suggest next (1000–1400ms between each)
- Never have two things happening at the same time. One change, then wait, then the next.

---

## Multi-Demo Page Coherence

### Viewport Behavior

- Demos start animating **only when scrolled into view** (IntersectionObserver, 30% threshold)
- Demos **pause when scrolled away** or when the browser tab is hidden
- Only one demo should be actively animating in the viewport at a time
- If `prefers-reduced-motion` is set, show a static populated frame (all elements visible, no animation)

### Visual Hierarchy on the Page

- The **hero demo** (full product overview) gets the richest treatment: `Grainient` background, largest container, longest cycle
- **Feature demos** (single-feature stories) use flat frost surfaces (`bg-surface-frost-05`), simpler backgrounds
- Feature demos are **smaller and simpler** than the hero — fewer columns, fewer steps, but still unhurried

### Narrative Independence

- Each demo shows **one feature in continuous use** — not a one-time tutorial
- Demos must not depend on each other or assume the viewer saw a previous demo
- Content (workspace names, team names) should be consistent across demos ("Acme Inc.") but feature stories are independent
- A viewer should be able to glance at any demo at any point in its cycle and understand what the feature does

---

## Content Voice

### Workspace and Team Data

- Workspace: "Acme Inc." (neutral, professional, universally relatable)
- Teams: Real software team names (Engineering, Design, Product, QA)
- Projects: Plausible software projects (Mobile App, API v2, Design System)
- People: First name + last initial (Sarah K., James L., Erik L.)

### Technical Content

- Requirements, questions, and answers must be **technically plausible**
- Questions should feel like they were generated by an AI that understands the requirement
- Answers should feel like they came from a real engineer
- Use real technology names (OAuth 2.0, JWT, WebSockets, SAML) — not made-up terms

### Forbidden Content

- No "lorem ipsum" or placeholder text
- No joke names, pop culture references, or internal team references
- No content that dates quickly (avoid specific years, version numbers that will age)
- No content that could be mistaken for real customer data

---

## Checklist for New MDAs (Director Review)

Before shipping, verify the demo passes both the engineering checklist (`docs/mini_demos.md`) and this creative review:

- [ ] Cycle follows the phase structure (Settle, Flow, Resolve, Drift)
- [ ] The loop is **seamless** — you cannot tell where it restarts by watching
- [ ] Total cycle is 20-30s
- [ ] The demo feels **ambient and unhurried**, not demanding attention
- [ ] Only one column animates at a time
- [ ] All entrances use the correct motion pattern for their element type
- [ ] Exits are gentle fades, not abrupt disappearances
- [ ] Only `duration-300` / `duration-500` / `duration-700` are used
- [ ] Selected state creates a clear visual thread with connectors
- [ ] Non-active siblings are properly dimmed
- [ ] The Drift hold is long enough to read everything on screen (3-4s)
- [ ] Content is technically plausible and professionally voiced
- [ ] Demo starts only when visible (IntersectionObserver)
- [ ] `prefers-reduced-motion` shows a static populated frame
- [ ] Watching the demo for 2 minutes does not feel repetitive or intrusive

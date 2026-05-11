---
name: mda-director
description: >-
  Direct the creative vision for a Mini Demo Animation (MDA) or Demo Mini Component (DMC)
  on the marketing site. Produces a Direction definition: goal, actors, rule descriptions,
  and content pool requirements. The engine is headless and rule-based — the Director
  defines WHAT can happen, not WHAT will happen. Use when creating or redesigning a demo.
---

# MDA Director

You are the Director. Your job is to define the creative direction for a rule-based Mini Demo Animation (MDA) or Demo Mini Component (DMC). You do not write code. You define the Direction — the goal, the actors, the capabilities (rules), and what content the pool needs.

The demo engine is **headless and non-deterministic**. You define what CAN happen. The engine decides what WILL happen at runtime based on state. You never script a specific sequence.

## Before You Begin

Read `docs/mda_director.md` in full. Every decision must comply with that rulebook.

## MDA vs DMC

Determine which type you are directing:

| | MDA | DMC |
|--|-----|-----|
| **Scope** | Full app window (sidebar, topbar, columns) | Focused single-feature interaction |
| **Where** | Landing page hero + feature sections | Article pages (one per article topic) |
| **Actors** | 2-4 (humans + AI) | 1-2 (typically just Arvid) |
| **Cycle** | 20-30s | 14-20s |
| **Container** | Absolute-positioned shell | Fixed-height, no layout shift |
| **Visual** | Full app chrome | Just the relevant UI fragment (card, modal, panel) |

**DMC-specific constraints:**
- The DMC renders in a **fixed-height container** — elements must crossfade, never cause layout shift
- The container has **no background** — the parent provides `bg-surface-frost-05`
- The DMC is shown in article cards too — it must look good at card scale
- Simpler narrative: show one interaction loop, not a multi-column workflow

## Your Output: Direction Spec

Produce exactly these sections. Mark the spec as **MDA** or **DMC** type at the top.

### 1. Mood

One paragraph. What should the viewer feel? Reference the Core Philosophy: ambient, unhurried, continuous.

### 2. Goal

One sentence defining when a cycle is "complete." The engine evaluates this against the abstract state.

Example (MDA): "The cycle ends when a requirement has been exported to both Linear and Cursor."
Example (DMC): "The cycle ends when the implementation modal has been viewed and closed."

The goal is a pure function on state — no UI concepts, no timing, no visual references.

### 3. Cast

| Character | Role | What they represent |
|-----------|------|---------------------|

Rules:
- **MDA:** 2-4 characters. At least one human and Arvid (AI).
- **DMC:** 1-2 characters. Arvid alone is acceptable for focused feature demos.

### 4. Capabilities (Rules)

List what each actor CAN do, as abstract state conditions. Not a sequence — a capability set.

Format:
```
ACTOR can VERB when STATE_CONDITION
```

These map 1:1 to Rule objects in the direction.ts file. The order they are listed suggests priority (higher = evaluated first) but the engine may evaluate differently.

**Critical:** Capabilities are NOT steps. The engine only fires a rule when the state condition is met and no higher-priority rule matches.

### 5. Content Pool Requirements

Describe what data the pool needs. Do NOT write the actual data — the implementer writes the pool.

For DMCs: the pool should have **3+ scenarios** that the demo cycles through for variety.

### 6. Viewer Takeaway

One sentence: "After glancing at this demo for 5 seconds, the viewer thinks: ..."

### 7. Director's Checklist

Validate against `docs/mda_director.md`:
- Cycle structure will emerge from rules (Settle → Flow → Resolve patterns)
- Goal enables endless looping (new cycle starts from living state)
- Actors have clear, non-overlapping capabilities
- Content pool supports multiple varied cycles
- **DMC only:** Container is fixed-height — no elements that appear/disappear and shift layout
- **DMC only:** Narrative is simple enough for a 14-20s cycle

## Constraints

- Do NOT write code, TypeScript types, or implementation details
- Do NOT specify timing, delays, or animation
- Do NOT describe UI components, cursor targets, or visual layout
- Capabilities are abstract state transitions, not UI actions
- The Direction is headless — it could drive any UI

## Shell Positioning Warning (MDA only)

If implementation work touches `MiniShell.tsx` or any wrapper around demo content: **never add `position: relative` to the same element that receives the demo's positioning `className` (which sets `position: absolute`).** Tailwind v4 resolves conflicting position utilities by stylesheet generation order, not class attribute order — `relative` can silently override `absolute` and break all demo anchoring. See `docs/mini_demos.md` § "MiniShell Positioning" for the full incident writeup and the required two-div structure.

## DMC Container Warning

DMC containers must have a **stable size** (use `aspect-square` for a square that fills parent width). They render in article pages and article cards — auto-sizing containers cause layout shift when elements animate in/out, pushing article body text around. Use opacity crossfades between states, never conditional mounting/unmounting at the top level. The container must have **no background color** — the parent provides `bg-surface-frost-05`.

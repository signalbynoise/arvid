---
name: mda-scriptwriter
description: >-
  Write the technical script (data.ts) for a Mini Demo Animation based on a
  Director's Treatment. Produces the SEQUENCE, collaborator definitions, cursor
  positions, and all static content. Use when a Director's Treatment exists and
  the user is ready to script a demo. Must run after mda-director, before implementation.
---

# MDA Script Writer

You are the Script Writer. You translate a Director's Treatment into the technical script that drives the demo. You produce `data.ts` — the single source of truth for timing, content, and cursor choreography.

## Before You Begin

1. Read `docs/mini_demos.md` in full — this is the engineering spec.
2. Read `docs/mda_director.md` in full — this is the creative spec.
3. Read the Director's Treatment for this demo. If no treatment exists, stop and tell the user to run the Director first.

## Your Output: data.ts

Produce the complete contents of `data.ts` for the demo, containing:

### 1. Static Content

All data arrays that populate the demo UI. Content must follow the Content Voice rules from `docs/mda_director.md`:
- Realistic, technically plausible text
- Real technology names
- No placeholder content
- People names as First + last initial

### 2. Collaborators

A `COLLABORATORS` array defining every cursor that appears:

```typescript
export const COLLABORATORS = [
  { id: 'sarah', name: 'Sarah K.' },
  { id: 'arvid', name: 'Arvid' },
] as const;
```

Cursors are always white (arrow + pill label). No color field. The name distinguishes collaborators, not color. Must match the cast from the Director's Treatment exactly.

### 3. SEQUENCE

The step array that drives `useSequence`. Each step has:

```typescript
{ action: 'step_name', delay: 1200, cursors: [...] }
```

#### Timing Rules (from docs)

| Category | Range |
|----------|-------|
| Reveals | 800-1200ms |
| Actions (clicks, selections) | 1000-1400ms |
| Fetches / loading | 1400-2000ms |
| Reading pauses | 2000-3000ms |
| Drift hold | 3000-4000ms |
| Minimum gap between changes | 800ms |
| Total cycle | 20-30s |

#### Phase Mapping

Add comments marking each phase boundary. The phases must match the Director's Treatment:

```typescript
// Settle (~Xs)
{ action: '...', delay: 0 },

// Flow (~Xs)
{ action: '...', delay: 1200 },

// Resolve (~Xs)
{ action: '...', delay: 1000 },

// Drift (~Xs)
{ action: 'reset', delay: 3500 },
```

#### Cursor Positions

Cursor positions use **target strings** that reference `data-cursor-target` attributes on DOM elements: `{ id, target: 'req-r13', visible? }`. Never use pixel values or percentages. The `MiniCursor` component resolves the target element's position from the DOM at runtime.

Target naming convention:
- Requirements: `req-{id}` (e.g. `req-r1`, `req-r13`)
- Questions: `q-{id}` (e.g. `q-q1`, `q-q2`)
- Answers: `a-{id}` (e.g. `a-a1`)
- Buttons: `btn-linear`, `btn-cursor`, `req-add`
- Column bodies: `req-column-body`, `q-column-body`
- Summary: `summary`
- Modal elements: `modal-import-slack`, `modal-slack-{id}`

The orchestrator adds `data-cursor-target` attributes to wrapper divs around each interactive element. Shared components are never modified.

#### Cursor-Arrive / Action-Fire Split (mandatory)

Every cursor movement MUST be a separate `noop` step **before** the action step. Never put cursors and actions in the same step. The viewer must see:
1. Cursor glides to element (`noop` step, 600-800ms delay)
2. Action fires (next step, 400-800ms delay)

```typescript
// Sarah's cursor moves to R13
{ action: 'noop', delay: 800, cursors: [{ id: 'sarah', target: 'req-r13' }] },
// Sarah clicks — R13 selects
{ action: 'select_requirement', delay: 600 },
```

This doubles the step count but keeps total timing in range because cursor-arrive and action-fire delays are shorter than a combined step would be. Only one cursor may move per `noop` step.

#### Beat Mapping

Every beat from the Director's Treatment must map to one or more steps. Add a comment referencing the beat number:

```typescript
// Beat 3: Sarah reviews questions
{ action: 'accept_q1', delay: 1200, cursors: [...] },
```

### 4. Validation

Before finalizing, verify:

- [ ] Total delay sum is 20-30s
- [ ] Phase proportions match the Director's Treatment budget
- [ ] Every beat from the treatment is represented
- [ ] Every collaborator from the cast has cursor entries
- [ ] No two cursors move in the same `noop` step (one cursor per move)
- [ ] Every cursor movement is a `noop` step BEFORE the action step — never simultaneous
- [ ] Cursor positions use target strings referencing `data-cursor-target` attributes, not coordinates
- [ ] The first step is `{ action: 'show_shell', delay: 0 }` (instant, seamless)
- [ ] The last step is `{ action: 'reset', delay: N }` where N is 3000-4000ms
- [ ] All delays are within the documented ranges
- [ ] Content is realistic and follows Content Voice rules

Print the total cycle duration and phase breakdown as a summary table.

## Constraints

- Produce ONLY `data.ts` content. No component code, no orchestrator logic, no CSS.
- All timing in the SEQUENCE, never in components.
- Use `Step` type from `src/site/components/mini-demo/types.ts`.
- Import domain types from the demo's own `types.ts`.
- Do NOT invent new step action names without explaining what UI state they control.

## Workflow Position

```
Director → [Script Writer] → Implementation
               ↑ you are here
```

The script must be reviewed before implementation begins. If the Director's Treatment changes, the script must be rewritten — never patch timing on top of a stale narrative.

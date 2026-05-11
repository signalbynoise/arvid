---
name: mda-scriptwriter
description: >-
  Write the direction.ts file for a Mini Demo Animation (MDA) or Demo Mini Component (DMC)
  based on a Director's spec. Produces the Direction object with goal function, Rule array,
  Actor definitions, and ContentPool. The engine is headless — rules are pure functions on
  abstract state. Use when a Director's spec exists and you are ready to implement the direction.
---

# MDA Script Writer

You are the Script Writer. You translate a Director's Direction Spec into a `direction.ts` file containing the Direction object that drives the headless demo engine.

## Before You Begin

1. Read `docs/mini_demos.md` — engineering spec.
2. Read `docs/mda_director.md` — creative spec.
3. Read the Director's Direction Spec. If none exists, stop.
4. Determine if this is an **MDA** or **DMC** from the spec.
5. Read the relevant type definitions:
   - **MDA:** `src/site/components/mini-demo/types.ts` for `Direction`, `Rule`, `DemoState`, `ContentPool`
   - **DMC:** `src/site/components/mini-demo/dmc-types.ts` for `DmcDirection<S, P>`, `DmcRule<S, P>`
6. Read `src/site/components/mini-demo/rules.ts` for available shared rule primitives (MDA only).

## MDA vs DMC

| | MDA | DMC |
|--|-----|-----|
| **Engine** | `useDemoEngine` | `useDmcEngine<S, P>` |
| **State type** | Shared `DemoState` (from `types.ts`) | Custom state type defined in `direction.ts` |
| **Pool type** | Shared `ContentPool` (from `types.ts`) | Custom pool type defined in `direction.ts` |
| **Direction type** | `Direction` | `DmcDirection<S, P>` |
| **Shared rules** | Reuse from `mini-demo/rules.ts` | Write custom rules (different state shape) |
| **Reset** | Hardcoded `startNewCycle` in engine | Explicit `resetCycle` function in direction |
| **Initial state** | Optional `initialState` partial merge | Required full `initialState` |

## Your Output: direction.ts

### 1. State Type (DMC only)

DMCs define their own state type. Keep it minimal — only fields the rules need.

```typescript
export type MyStep = 'idle' | 'focus' | 'open' | 'animate' | 'hold' | 'close';

export interface MyState {
  step: MyStep;
  scenarioIndex: number;
  cycleCount: number;
}
```

### 2. Pool Type (DMC only)

DMCs define their own content pool type. Include 3+ scenarios for variety.

```typescript
export interface MyPool {
  scenarios: Array<{ ... }>;
}
```

### 3. Actors

Define Actor constants matching the Director's cast:

```typescript
const ARVID = { id: 'arvid', name: 'Arvid' };
```

### 4. Content Pool

Content follows `docs/mda_director.md` Content Voice rules. The pool should be large enough to support multiple varied cycles.

### 5. Rules Array

Map each capability from the Director's spec to a Rule.

- **MDA:** Use shared primitives from `mini-demo/rules.ts` where possible.
- **DMC:** Write custom rules (different state shape from `DemoState`).

Rules are **pure functions on state**. They MUST NOT:
- Reference DOM elements, cursor targets, or component names
- Contain timing or delay values
- Know about the visual layer

Rules return **Transitions** with abstract verbs and subjects:
```typescript
{ actor: 'arvid', verb: 'evaluate', subject: 'confidence', stateUpdate: fn }
```

### 6. Goal Function

A pure predicate on state:
```typescript
goal: (s) => s.step === 'close'
```

### 7. Direction Export

**MDA:**
```typescript
export const heroDirection: Direction = {
  goal,
  actors: [SARAH, ARVID],
  rules,
  contentPool,
  initialState: { requirements: [...] },
};
```

**DMC:**
```typescript
export const myDirection: DmcDirection<MyState, MyPool> = {
  goal,
  actors: [ARVID],
  rules,
  contentPool,
  initialState: INITIAL_STATE,
  resetCycle: (state) => ({
    ...INITIAL_STATE,
    scenarioIndex: (state.scenarioIndex + 1) % contentPool.scenarios.length,
    cycleCount: state.cycleCount + 1,
  }),
};
```

## Validation

- [ ] Goal is a pure function on state
- [ ] Every Director capability maps to at least one Rule
- [ ] **MDA:** Rules use shared primitives where applicable
- [ ] No Rule references UI concepts (targets, components, delays)
- [ ] Content pool has enough variety for 3+ distinct cycles
- [ ] All content follows Content Voice rules (realistic, no placeholders)
- [ ] Actors match the Director's cast exactly
- [ ] **DMC:** State type is minimal — only fields rules need
- [ ] **DMC:** `resetCycle` properly resets state and advances `scenarioIndex`
- [ ] **DMC:** `initialState` is a complete state object (not a partial)

## Constraints

- Produce ONLY `direction.ts`. No orchestrator code, no component changes.
- Rules are headless — zero UI knowledge.
- **MDA:** Use existing shared rule primitives from `mini-demo/rules.ts` before writing custom ones.
- Custom rules go in the direction.ts file, not in the shared rules.

## Shell Positioning Warning (MDA only)

If you modify `MiniShell.tsx` or any shared primitive that wraps demo content: **never add `position: relative` to the same element that receives the demo's `className` (which sets `position: absolute`).** See `docs/mini_demos.md` § "MiniShell Positioning".

## DMC Container Warning

DMC orchestrators must render in a **stable-size container** (use `aspect-square` for a square that fills parent width). Use opacity crossfades between visual states — never conditional rendering that adds/removes elements and shifts layout. The container must have **no background color** — the parent provides `bg-surface-frost-05`.

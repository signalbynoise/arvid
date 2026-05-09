---
name: mda-scriptwriter
description: >-
  Write the direction.ts file for a Mini Demo Animation based on a Director's spec.
  Produces the Direction object with goal function, Rule array, Actor definitions, and
  ContentPool. The engine is headless — rules are pure functions on abstract state.
  Use when a Director's spec exists and you are ready to implement the direction.
---

# MDA Script Writer

You are the Script Writer. You translate a Director's Direction Spec into a `direction.ts` file containing the Direction object that drives the headless demo engine.

## Before You Begin

1. Read `docs/mini_demos.md` — engineering spec.
2. Read `docs/mda_director.md` — creative spec.
3. Read the Director's Direction Spec. If none exists, stop.
4. Read `src/site/components/mini-demo/types.ts` for type definitions.
5. Read `src/site/components/mini-demo/rules.ts` for available shared rule primitives.

## Your Output: direction.ts

### 1. Actors

Define Actor constants matching the Director's cast:

```typescript
const SARAH = { id: 'sarah', name: 'Sarah K.' };
const ARVID = { id: 'arvid', name: 'Arvid' };
```

### 2. Content Pool

A `ContentPool` object with all data the demo needs. Content follows `docs/mda_director.md` Content Voice rules. The pool should be large enough to support multiple varied cycles.

### 3. Rules Array

Map each capability from the Director's spec to a Rule. Use shared primitives from `mini-demo/rules.ts` where possible. Write custom rules only for demo-specific behavior.

Rules are **pure functions on DemoState**. They MUST NOT:
- Reference DOM elements, cursor targets, or component names
- Contain timing or delay values
- Know about the visual layer

Rules return **Transitions** with abstract verbs and subjects:
```typescript
{ actor: 'sarah', verb: 'select', subject: 'r3', stateUpdate: fn }
```

The orchestrator (AppDemo.tsx / GitHubDemo.tsx) is responsible for mapping these to cursor targets and component props.

### 4. Goal Function

A pure predicate on DemoState:
```typescript
goal: (s) => s.exports.includes('cursor')
```

### 5. Direction Export

```typescript
export const heroDirection: Direction = {
  goal,
  actors: [SARAH, ARVID, DAVID],
  rules,
  contentPool,
  initialState: { requirements: [...] },
};
```

## Validation

- [ ] Goal is a pure function on DemoState
- [ ] Every Director capability maps to at least one Rule
- [ ] Rules use shared primitives where applicable
- [ ] No Rule references UI concepts (targets, components, delays)
- [ ] Content pool has enough variety for 3+ distinct cycles
- [ ] All content follows Content Voice rules (realistic, no placeholders)
- [ ] Actors match the Director's cast exactly

## Constraints

- Produce ONLY `direction.ts`. No orchestrator code, no component changes.
- Rules are headless — zero UI knowledge.
- Use existing shared rule primitives from `mini-demo/rules.ts` before writing custom ones.
- Custom rules go in the direction.ts file, not in the shared rules.

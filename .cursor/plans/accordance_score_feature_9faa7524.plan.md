---
name: Accordance Score Feature
overview: Add a deterministic "Accordance Score" to the implementation check, computed from boolean LLM checks per summary dimension (core_objective, architecture, constraints, unverified_risks) with fixed weights, stored as a JSON object alongside the existing impl_status.
todos:
  - id: db-accordance
    content: Add impl_analysis jsonb column to requirements table via Supabase migration
    status: completed
  - id: schema-accordance
    content: Add ImplAnalysis interface to shared/schemas/implCheck.ts and impl_analysis field to RequirementRowSchema + transform
    status: completed
  - id: llm-accordance
    content: Extend classifyImplementation prompt to ask 4 boolean questions when summary is provided, update response schema
    status: completed
  - id: compute-score
    content: Add deterministic computeAccordanceScore function and persist impl_analysis in webhook + API route
    status: completed
  - id: modal-accordance
    content: Add Accordance Score section to ImplDetailsModal with score bar and dimension checklist
    status: completed
isProject: false
---

# Accordance Score

## Concept

The Accordance Score measures how faithfully the code implementation follows the knowledge graph spec (requirement -> questions -> answers -> summary). It is a **single 0-100 number** computed deterministically from boolean checklist answers per summary dimension, using **fixed weights**.

The LLM answers 4 yes/no questions (one per summary section). Arvid computes the score. No LLM judgment on the final number.

## Scoring Rubric

| Dimension | Summary Field | Weight | LLM Question |
|-----------|--------------|--------|-------------|
| Objective | `core_objective` | 40% | "Does the codebase fulfill the stated core objective?" |
| Architecture | `architecture` | 30% | "Does the code follow the specified architecture and design patterns?" |
| Constraints | `constraints` | 20% | "Does the code respect the stated constraints and boundaries?" |
| Risks | `unverified_risks` | 10% | "Are the flagged unverified risks addressed or mitigated in the code?" |

**Score computation** (deterministic, in application code):

```
score = (objective * 40) + (architecture * 30) + (constraints * 20) + (risks * 10)
```

Each boolean is 0 or 1. Score range: 0-100. No LLM involvement in the math.

## Data Model

Single new JSON column on `requirements`:

```sql
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS impl_analysis jsonb;
```

Shape stored:

```typescript
{
  accordance_score: number,        // 0-100, computed
  objective_met: boolean,
  architecture_met: boolean,
  constraints_met: boolean,
  risks_addressed: boolean,
  checked_at: string               // ISO timestamp
}
```

This keeps everything in one flexible column. The top-level `accordance_score` is easy to extract for analytics later via `impl_analysis->>'accordance_score'`.

## Changes

### 1. Database -- [Supabase migration]

Add `impl_analysis jsonb` column to `requirements`.

### 2. Schema -- [shared/schemas/requirement.ts](shared/schemas/requirement.ts)

Add `impl_analysis` to `RequirementRowSchema` as `z.unknown().nullable().optional()` (flexible JSON), and map to `implAnalysis` in the transform.

Add a typed interface `ImplAnalysis` in [shared/schemas/implCheck.ts](shared/schemas/implCheck.ts) for the shape (used server-side and in the modal).

### 3. Server -- Extend `classifyImplementation` in [server/openrouter.ts](server/openrouter.ts)

The current LLM call already receives the requirement context and repo context. Extend the prompt to also ask 4 boolean questions **only when a summary is available**. The LLM response schema adds 4 optional boolean fields:

```typescript
objective_met: z.boolean().optional(),
architecture_met: z.boolean().optional(),
constraints_met: z.boolean().optional(),
risks_addressed: z.boolean().optional(),
```

The summary text (`core_objective`, `architecture`, `constraints`, `unverified_risks`) is appended to the user prompt so the LLM can compare spec vs code.

**Token efficiency**: the summary text is typically 4-8 sentences total -- minimal extra tokens. The 4 boolean answers add ~20 tokens to the response.

### 4. Server -- Compute and persist in [server/routes/webhooks.ts](server/routes/webhooks.ts) and [server/routes/requirements.ts](server/routes/requirements.ts)

After the LLM returns, compute the score deterministically in application code:

```typescript
const WEIGHTS = { objective: 40, architecture: 30, constraints: 20, risks: 10 };

function computeAccordanceScore(result: ImplementationCheckResponse): number | null {
  if (result.objective_met === undefined) return null;
  return (
    (result.objective_met ? WEIGHTS.objective : 0) +
    (result.architecture_met ? WEIGHTS.architecture : 0) +
    (result.constraints_met ? WEIGHTS.constraints : 0) +
    (result.risks_addressed ? WEIGHTS.risks : 0)
  );
}
```

Persist as `impl_analysis` JSON alongside the existing `impl_status`/`impl_confidence`/`impl_evidence`.

### 5. Frontend -- Update [ImplDetailsModal](src/app/components/ImplDetailsModal.tsx)

Add an "Accordance Score" section below the existing confidence bar:
- Show the overall score as a percentage bar (same style as confidence)
- Show the 4 dimensions as a simple checklist with check/cross icons and their weights
- Only renders when `implAnalysis` is present (i.e., a summary existed when the check ran)

### 6. Frontend -- Update [GitHubStatusChip](src/app/components/GitHubStatusChip.tsx)

No change to the chip itself -- the accordance score is a detail shown in the modal, not on the card. The card already shows `impl_status` which is the primary signal.

## What stays unchanged

- The `impl_status` enum and chip behavior
- The `impl_confidence` field (LLM's confidence in its own determination)
- The `impl_evidence` text
- The webhook trigger flow
- The repo context refresh

## Key constraint: no summary = no accordance score

If a requirement has no summary (the user never generated one), the accordance check is skipped and `impl_analysis` stays null. The modal simply won't show the accordance section. This is correct because without a summary, there's no spec to measure against.

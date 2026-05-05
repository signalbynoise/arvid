---
name: AI Suggested Answers
overview: Add AI-suggested answers that mirror the existing suggested questions pattern. When a question is technical (answerable from LLM/web knowledge), Arvid generates a best-practice suggested answer. When the question is domain-specific or only a human can answer, no suggestion is provided.
todos:
  - id: schema
    content: Add is_suggested and is_hidden to answer schema + Supabase migration + update docs/architecture.md
    status: completed
  - id: llm-function
    content: Add suggestAnswer() in server/openrouter.ts with Zod-validated response schema, structured logging, explicit errors
    status: completed
  - id: api-route
    content: Add POST /answers/suggest/:questionId in server/routes/answers.ts with structured logging
    status: completed
  - id: frontend-api
    content: Add suggestAnswer() to src/app/api.ts with Zod boundary validation
    status: completed
  - id: store
    content: Add suggestAnswer, useSuggestedAnswer, hideSuggestedAnswer to entities slice with dedup Set, optimistic updates, rollback, logging
    status: completed
  - id: suggested-answer-card
    content: Create SuggestedAnswerCard.tsx as own file (Rule 6) with props-driven rendering (Rule 7)
    status: completed
  - id: answer-column
    content: Update AnswerColumn.tsx to render SuggestedAnswerCard, filter hidden, show loading spinner
    status: completed
  - id: triggers
    content: "Wire trigger points: auto-suggest on question select, on useSuggestion, skip if already answered"
    status: completed
  - id: tests
    content: Unit tests (LLM parsing, Zod schema, store actions), integration tests (API endpoint, store+API flow), component tests (SuggestedAnswerCard, AnswerColumn)
    status: completed
isProject: false
---

# AI Suggested Answers

## Current State

Arvid generates **suggested questions** via `POST /questions/suggest/:requirementId` which calls `suggestQuestions()` in [`server/openrouter.ts`](server/openrouter.ts). Questions are inserted with `is_suggested: true`, `author: 'Arvid'`, and rendered in the UI as dashed-border "AI Suggestion" cards with Use/Hide buttons.

Answers have no AI equivalent -- they are always manually created by users via [`NewAnswerModal`](src/app/components/NewAnswerModal.tsx).

## Design

### Core Logic: Classify + Suggest

When a question is selected (or accepted via "Use Question"), Arvid should:

1. **Classify the question** as either `answerable_by_ai` or `requires_human` based on whether Arvid can provide a best-practice answer from general software engineering knowledge.
2. **For `answerable_by_ai` questions only**, generate a suggested answer using LLM knowledge.
3. **For `requires_human` questions**, return a skip signal with reasoning -- no suggested answer is generated.

### Classification Heuristics (in the LLM prompt)

**Answerable by AI** (suggest an answer):
- Technical architecture decisions (e.g., "Should we use OAuth2 or session-based auth?")
- Best practice questions (e.g., "What fields should the users table have?")
- Implementation pattern questions (e.g., "How should we handle token refresh?")
- Technology comparison questions (e.g., "Should we use REST or GraphQL?")

**Requires human** (skip, no suggestion):
- Internal workflow questions (e.g., "Who is the product owner for this feature?")
- Business-specific decisions (e.g., "What is our budget for this?")
- Timeline/scheduling questions (e.g., "When is the deadline?")
- Organization-specific questions (e.g., "Which team handles deployments?")
- Subjective choices only stakeholders can decide

---

## 1. Schema Changes

### Answer schema ([`shared/schemas/answer.ts`](shared/schemas/answer.ts))

Add `is_suggested` and `is_hidden` to all answer schemas, mirroring the question schema pattern:

- `AnswerRowSchema`: add `is_suggested: z.boolean().nullable().optional()` and `is_hidden: z.boolean().nullable().optional()`
- `AnswerSchema` transform: add `isSuggested: row.is_suggested ?? undefined` and `isHidden: row.is_hidden ?? undefined`
- `CreateAnswerBodySchema`: add both as optional nullable booleans
- `UpdateAnswerBodySchema`: add both as optional nullable booleans

### Supabase migration

Add two columns to the `answers` table: `is_suggested boolean default false`, `is_hidden boolean default false`.

### Architecture doc ([`docs/architecture.md`](docs/architecture.md))

Update the `answers` table description to include the new columns. Add `POST /api/answers/suggest/:questionId` to the API endpoints table.

---

## 2. Server: LLM Function

### New function in [`server/openrouter.ts`](server/openrouter.ts)

Add `suggestAnswer()` following the exact same patterns as `suggestQuestions()`:

- **Input interface** `SuggestAnswerInput`: question text, requirement context (title, description, existing Q&A), repo context
- **Response Zod schema** `SuggestAnswerResponseSchema` (Rule 13 -- validate at boundary):

```typescript
const SuggestAnswerResponseSchema = z.object({
  answerable: z.boolean(),
  answer_text: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
});
```

- **System prompt**: Instructs the LLM to first classify answerability, then provide a best-practice answer if appropriate. Grounded in requirement context and codebase context.
- **Temperature**: `0.3` (same as summary generation -- we want precise, reliable answers)
- **Structured logging** (Rule 19): log start (`[INFO] [openrouter:suggestAnswer]`), success, and failure with context `{ questionText, answerable, confidence }`
- **Error handling** (Rule 16): throw typed errors on API failure, invalid JSON, or schema validation failure -- never swallow

---

## 3. Server: API Route

### New endpoint in [`server/routes/answers.ts`](server/routes/answers.ts)

`POST /answers/suggest/:questionId`:

1. Fetch the question from DB
2. Load requirement context via `fetchRequirementContext(db, requirementId)` from [`server/context.ts`](server/context.ts)
3. Call `suggestAnswer()` with full context
4. If `answerable === true`: insert answer row with `is_suggested: true`, `author: 'Arvid'`, `is_current: false`, return the created answer
5. If `answerable === false`: return `{ skipped: true, reasoning: "..." }` with `200`
6. Structured logging at every step (Rule 19)
7. Explicit error responses with context (Rule 16)

---

## 4. Frontend: Infrastructure Layer

### API client ([`src/app/api.ts`](src/app/api.ts))

Add `suggestAnswer(questionId: string)` method:
- `POST /answers/suggest/${questionId}`
- Parse response with `AnswerSchema` when an answer is returned
- Handle the `{ skipped: true }` response variant
- Validate with Zod at the boundary (Rule 13)

---

## 5. Frontend: State Layer

### Store actions ([`src/app/store/slices/entities.ts`](src/app/store/slices/entities.ts))

Add to `EntitiesSlice` interface and implementation:

- **State**: `suggestingAnswerForQuestions: Set<string>` (mirrors `suggestingForRequirements` pattern for dedup, Rule 10)
- **`suggestAnswer(questionId: string)`**: dedup via Set, call API, append to `answers` array if returned, remove from Set on completion. Log start/success/failure (Rule 19). Optimistic state transitions with rollback on failure.
- **`useSuggestedAnswer(answerId: string)`**: set `isSuggested: false` optimistically, PATCH `is_suggested: false` (mirrors `useSuggestion` for questions)
- **`hideSuggestedAnswer(answerId: string)`**: set `isHidden: true` optimistically, PATCH `is_hidden: true` (mirrors `hideSuggestion`)

---

## 6. Frontend: UI Layer

### New component: `SuggestedAnswerCard` ([`src/app/components/SuggestedAnswerCard.tsx`](src/app/components/SuggestedAnswerCard.tsx))

Extracted into its own file per Rule 6 (No Inline Components). Accepts data via props (Rule 7 -- reusable by default):

- Props: `answer: Answer`, `onUse: (id: string) => void`, `onHide: (id: string) => void`
- Visual treatment: dashed border, "AI Suggestion" pill, Use/Hide buttons -- same pattern as suggested question cards in [`QuestionColumn.tsx`](src/app/components/QuestionColumn.tsx)
- Styling via Tailwind token classes only (Rule 5)

### Update [`AnswerColumn.tsx`](src/app/components/AnswerColumn.tsx)

- Filter out hidden suggested answers (`isHidden === true`)
- Render `SuggestedAnswerCard` for answers where `isSuggested === true`
- Wire `useSuggestedAnswer` and `hideSuggestedAnswer` from store
- Show loading spinner while `suggestingAnswerForQuestions` contains the selected question ID

---

## 7. Trigger Points

Answer suggestions should be triggered:

1. **When a question is accepted** ("Use Question") -- `useSuggestion` action also calls `suggestAnswer` for that question
2. **When a question is selected** and has no answers and no pending suggestion -- `AnswerColumn` dispatches to store (same pattern as `QuestionColumn` lines 233-237)
3. **NOT** for already-answered questions (`status: 'Answered'`)

---

## 8. Testing (Rule 20)

### Unit tests

- `suggestAnswer()` LLM response parsing: valid answerable response, valid skipped response, malformed JSON, schema validation failure
- `SuggestAnswerResponseSchema` Zod validation: all fields, nullable `answer_text`, invalid enum values
- Store actions: `suggestAnswer` state transitions, `useSuggestedAnswer` optimistic update + rollback, `hideSuggestedAnswer` optimistic update + rollback

### Integration tests

- `POST /answers/suggest/:questionId`: answerable question returns created answer, unanswerable question returns skip, missing question returns 404, missing API key returns error
- Store + API integration: full suggest-use-hide flow with mocked API

### Component tests

- `SuggestedAnswerCard`: renders AI Suggestion pill, Use/Hide buttons fire callbacks, props-driven rendering
- `AnswerColumn`: renders suggested answers differently from manual answers, filters hidden suggestions, shows spinner during suggestion

---

## Files to Change

- [`shared/schemas/answer.ts`](shared/schemas/answer.ts) -- add `is_suggested`, `is_hidden` fields
- [`server/openrouter.ts`](server/openrouter.ts) -- add `suggestAnswer()` with Zod-validated response
- [`server/routes/answers.ts`](server/routes/answers.ts) -- add `POST /answers/suggest/:questionId`
- [`src/app/api.ts`](src/app/api.ts) -- add `suggestAnswer()` API method
- [`src/app/store/slices/entities.ts`](src/app/store/slices/entities.ts) -- add suggest/use/hide answer actions
- [`src/app/components/SuggestedAnswerCard.tsx`](src/app/components/SuggestedAnswerCard.tsx) -- new file (Rule 6)
- [`src/app/components/AnswerColumn.tsx`](src/app/components/AnswerColumn.tsx) -- integrate suggested answers
- [`docs/architecture.md`](docs/architecture.md) -- update API table and answers table description
- Supabase migration -- add columns
- Test files for unit, integration, and component tests

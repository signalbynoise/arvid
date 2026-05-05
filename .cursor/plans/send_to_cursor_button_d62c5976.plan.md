---
name: Send to Cursor button
overview: Implement the "Send to Cursor" button using Cursor's deeplink protocol to open a new agent chat with a pre-filled prompt generated from the summary.
todos:
  - id: deeplink-util
    content: Create `src/app/utils/cursorDeeplink.ts` — builds the prompt from Summary data and constructs the deeplink URL
    status: completed
  - id: wire-button
    content: Add onClick handler to the "Send to Cursor" button in SummaryColumn.tsx that calls the deeplink utility
    status: completed
isProject: false
---

# Send to Cursor Button — Option A (Direct Deeplink)

## Mechanism

Cursor supports deeplinks that open the IDE with a pre-filled prompt:

```
cursor://anysphere.cursor-deeplink/prompt?text=URL_ENCODED_PROMPT
```

- Prompt appears in Cursor chat; user reviews and confirms before execution
- No automatic execution (safety by design)
- Max URL length: 8,000 characters (URL-encoded) — not a concern since Arvid summaries never exceed this

There is no deeplink param to force plan mode, but the prompt text itself can instruct the agent to use plan mode.

## Files to Change

- **New:** [`src/app/utils/cursorDeeplink.ts`](src/app/utils/cursorDeeplink.ts)
  - `buildCursorPrompt(summary: Summary, requirementTitle: string): string` — assembles the prompt
  - `openInCursor(prompt: string): void` — URL-encodes and opens deeplink via `window.open()`

- **Edit:** [`src/app/components/SummaryColumn.tsx`](src/app/components/SummaryColumn.tsx) (line 214)
  - Add `onClick` that calls `openInCursor(buildCursorPrompt(summary, requirement.title))`

## Summary Type (available data)

From `shared/schemas/summary.ts`:

```typescript
{
  synthesis: string;       // high-level summary
  coreObjective: string;   // what to build
  architecture: string;    // how to build it
  constraints: string;     // rules & limitations
  unverifiedRisks: string; // potential risks
}
```

## Prompt Template

```
Use plan mode.

# {requirementTitle}

## Objective
{summary.coreObjective}

## Synthesis
{summary.synthesis}

## Architecture
{summary.architecture}

## Constraints
{summary.constraints}

## Risks
{summary.unverifiedRisks}

Based on this Arvid specification, create an implementation plan.
```

## Implementation Detail

The `onClick` handler:
1. Calls `buildCursorPrompt(summary, requirement.title)` to assemble the string
2. Calls `openInCursor(prompt)` which does:
   ```typescript
   const url = new URL('cursor://anysphere.cursor-deeplink/prompt');
   url.searchParams.set('text', prompt);
   window.open(url.toString(), '_self');
   ```
3. OS hands the `cursor://` protocol to the Cursor app, which opens a new chat with the prompt pre-filled
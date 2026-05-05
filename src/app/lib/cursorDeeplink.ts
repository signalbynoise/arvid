import type { Summary } from '../../../shared/schemas/summary';

const DEEPLINK_BASE = 'cursor://anysphere.cursor-deeplink/prompt';

export function buildCursorPrompt(
  summary: Summary,
  requirementTitle: string,
): string {
  return [
    'Use plan mode.',
    '',
    `# ${requirementTitle}`,
    '',
    '## Objective',
    summary.coreObjective,
    '',
    '## Synthesis',
    summary.synthesis,
    '',
    '## Architecture',
    summary.architecture,
    '',
    '## Constraints',
    summary.constraints,
    '',
    '## Risks',
    summary.unverifiedRisks,
    '',
    'Based on this Arvid specification, create an implementation plan.',
  ].join('\n');
}

export function openInCursor(prompt: string): void {
  const url = new URL(DEEPLINK_BASE);
  url.searchParams.set('text', prompt);
  window.open(url.toString(), '_self');
}

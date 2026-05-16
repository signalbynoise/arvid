import type { Summary } from '../../../shared/schemas/summary';

const DEEPLINK_BASE = 'cursor://anysphere.cursor-deeplink/prompt';

export interface LinearIssueRef {
  identifier: string;
  url: string;
}

export function buildCursorPrompt(
  summary: Summary,
  requirementTitle: string,
  figmaUrls?: string[],
  linearIssue?: LinearIssueRef,
): string {
  const parts = [
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
  ];

  if (figmaUrls && figmaUrls.length > 0) {
    parts.push('', '## Design Files');
    for (const url of figmaUrls) {
      parts.push(`- ${url}`);
    }
  }

  if (linearIssue) {
    parts.push(
      '',
      '## Linear Issue',
      `This requirement is tracked as ${linearIssue.identifier} (${linearIssue.url}) in Linear.`,
      `After implementing this specification, update Linear issue ${linearIssue.identifier} to reflect the implementation status.`,
    );
  }

  parts.push('', 'Based on this Arvid specification, create an implementation plan.');

  return parts.join('\n');
}

export function openInCursor(prompt: string): void {
  const url = new URL(DEEPLINK_BASE);
  url.searchParams.set('text', prompt);
  window.open(url.toString(), '_self');
}

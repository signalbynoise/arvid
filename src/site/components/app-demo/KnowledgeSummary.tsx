import { MiniCardHeader, MiniCardTitle, MiniSummaryCardContent, MiniCollapsible, MiniProgressBar, MiniTagList, MiniIntegrationButton, MiniIntegrationBar, MiniLoadingState, MiniBodyText } from '../mini-demo';
import type { Summary } from './types';

interface KnowledgeSummaryProps {
  summary: Summary;
  completeness: number;
  sendEnabled: boolean;
  generating: boolean;
}

export function KnowledgeSummary({ summary, completeness, sendEnabled, generating }: KnowledgeSummaryProps) {
  return (
    <MiniSummaryCardContent
      header={
        <>
          <MiniCardHeader shortId={summary.shortId} />
          <MiniCardTitle>{summary.title}</MiniCardTitle>
        </>
      }
    >
      {generating ? (
        <MiniLoadingState message="Arvid is analyzing..." />
      ) : (
        <>
          <MiniCollapsible title="Knowledge Completeness" open>
            <MiniProgressBar value={completeness} />
          </MiniCollapsible>

          <MiniCollapsible title="Core Objective" open>
            <MiniBodyText>{summary.objective}</MiniBodyText>
          </MiniCollapsible>

          <MiniCollapsible title="Architecture" borderBottom={false}>
            <MiniTagList tags={summary.tags} />
          </MiniCollapsible>

          <MiniIntegrationBar>
            <MiniIntegrationButton icon="/linear.svg" label="Linear" />
            <MiniIntegrationButton icon="/cursor.svg" label="Cursor" enabled={sendEnabled} />
          </MiniIntegrationBar>
        </>
      )}
    </MiniSummaryCardContent>
  );
}

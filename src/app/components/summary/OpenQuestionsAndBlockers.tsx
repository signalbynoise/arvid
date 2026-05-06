import React from 'react';
import { SummarySection } from './SummarySection';
import { Question } from '../../types';

interface OpenQuestionsAndBlockersProps {
  unverifiedRisks: string;
  missingCritical: Question[];
  conflicts: Question[];
}

export function OpenQuestionsAndBlockers({ unverifiedRisks, missingCritical, conflicts }: OpenQuestionsAndBlockersProps) {
  return (
    <>
      <SummarySection title="Open Questions">
        <div className="space-y-2">
          {missingCritical.length > 0 ? (
            <ul className="space-y-1.5">
              {missingCritical.map(q => (
                <li key={q.id} className="leading-snug">{q.text}</li>
              ))}
            </ul>
          ) : (
            <p className="text-text-quaternary">No open critical questions.</p>
          )}
          {conflicts.length > 0 && (
            <ul className="space-y-1.5 mt-2">
              {conflicts.map(q => (
                <li key={q.id} className="text-status-warning leading-snug">{q.text}</li>
              ))}
            </ul>
          )}
        </div>
      </SummarySection>

      <SummarySection title="Risks">
        <p className="leading-relaxed">{unverifiedRisks}</p>
      </SummarySection>
    </>
  );
}

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { SummarySection } from './SummarySection';
import { Question } from '../../types';

interface OpenQuestionsAndBlockersProps {
  unverifiedRisks: string;
  missingCritical: Question[];
  conflicts: Question[];
}

export function OpenQuestionsAndBlockers({ unverifiedRisks, missingCritical, conflicts }: OpenQuestionsAndBlockersProps) {
  const hasIssues = missingCritical.length > 0 || conflicts.length > 0;

  return (
    <SummarySection
      icon={AlertTriangle}
      title="Open Questions & Blockers"
      defaultOpen={false}
      titleClassName={hasIssues ? 'text-status-warning' : 'text-text-secondary'}
    >
      <div className="space-y-4">
        <p className="text-[13px] text-status-warning leading-relaxed">{unverifiedRisks}</p>
        
        {missingCritical.length > 0 && (
          <div className="bg-status-error-surface-subtle border border-status-error-border p-4 rounded-card">
            <div className="flex items-center space-x-2 text-status-error font-[var(--fw-medium)] mb-3 text-[13px]">
              <ShieldAlert size={14} />
              <span>Missing Critical Answers</span>
            </div>
            <ul className="space-y-2">
              {missingCritical.map(q => (
                <li key={q.id} className="text-[13px] text-text-primary bg-surface-frost-03 border border-status-error-border-muted rounded-comfortable p-2.5 leading-snug">
                  {q.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="bg-status-warning-surface-subtle border border-status-warning-border p-4 rounded-card">
            <div className="flex items-center space-x-2 text-status-warning font-[var(--fw-medium)] mb-3 text-[13px]">
              <AlertTriangle size={14} />
              <span>Active Conflicts</span>
            </div>
            <ul className="space-y-2">
              {conflicts.map(q => (
                <li key={q.id} className="text-[13px] text-text-primary bg-surface-frost-03 border border-status-warning-border-muted rounded-comfortable p-2.5 leading-snug">
                  {q.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SummarySection>
  );
}

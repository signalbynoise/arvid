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
      defaultOpen={hasIssues}
      titleClassName={hasIssues ? 'text-[#f59e0b]' : 'text-[#d0d6e0]'}
    >
      <div className="space-y-4">
        <p className="text-[13px] text-[#f59e0b] leading-relaxed">{unverifiedRisks}</p>
        
        {missingCritical.length > 0 && (
          <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] p-4 rounded-[8px]">
            <div className="flex items-center space-x-2 text-[#ef4444] font-[510] mb-3 text-[13px]">
              <ShieldAlert size={14} />
              <span>Missing Critical Answers</span>
            </div>
            <ul className="space-y-2">
              {missingCritical.map(q => (
                <li key={q.id} className="text-[13px] text-[#f7f8f8] bg-[rgba(255,255,255,0.03)] border border-[rgba(239,68,68,0.15)] rounded-[6px] p-2.5 leading-snug">
                  {q.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] p-4 rounded-[8px]">
            <div className="flex items-center space-x-2 text-[#f59e0b] font-[510] mb-3 text-[13px]">
              <AlertTriangle size={14} />
              <span>Active Conflicts</span>
            </div>
            <ul className="space-y-2">
              {conflicts.map(q => (
                <li key={q.id} className="text-[13px] text-[#f7f8f8] bg-[rgba(255,255,255,0.03)] border border-[rgba(245,158,11,0.15)] rounded-[6px] p-2.5 leading-snug">
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

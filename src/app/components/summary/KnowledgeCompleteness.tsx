import React from 'react';
import { SummarySection } from './SummarySection';

interface KnowledgeCompletenessProps {
  completeness: number;
  reasoning?: string;
}

export function KnowledgeCompleteness({ completeness, reasoning }: KnowledgeCompletenessProps) {
  return (
    <SummarySection title="Knowledge Completeness" defaultOpen>
      <div className="h-1.5 bg-surface-frost-10 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${
            completeness >= 80 ? 'bg-status-success' : completeness >= 50 ? 'bg-status-warning' : 'bg-status-error'
          }`} 
          style={{ '--progress': `${completeness}%` } as React.CSSProperties} 
        />
      </div>
      {reasoning && (
        <p className="text-text-tertiary leading-relaxed mt-2">{reasoning}</p>
      )}
    </SummarySection>
  );
}

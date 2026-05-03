import React from 'react';
import { Target } from 'lucide-react';
import { SummarySection } from './SummarySection';

interface KnowledgeCompletenessProps {
  completeness: number;
}

export function KnowledgeCompleteness({ completeness }: KnowledgeCompletenessProps) {
  return (
    <SummarySection icon={Target} title="Knowledge Completeness" defaultOpen>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 w-full">
          <div className="flex-1 h-1.5 bg-surface-frost-10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                completeness >= 80 ? 'bg-status-success' : completeness >= 50 ? 'bg-status-warning' : 'bg-status-error'
              }`} 
              style={{ '--progress': `${completeness}%` } as React.CSSProperties} 
            />
          </div>
          <span className="font-[var(--fw-medium)] text-text-primary text-[13px] w-8 text-right">{completeness}%</span>
        </div>
      </div>
    </SummarySection>
  );
}

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
          <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                completeness >= 80 ? 'bg-[#10b981]' : completeness >= 50 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
              }`} 
              style={{ width: `${completeness}%` }} 
            />
          </div>
          <span className="font-[510] text-[#f7f8f8] text-[13px] w-8 text-right">{completeness}%</span>
        </div>
      </div>
    </SummarySection>
  );
}

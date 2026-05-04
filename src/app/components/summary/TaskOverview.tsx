import React from 'react';
import { Network } from 'lucide-react';
import { SummarySection } from './SummarySection';

interface TaskOverviewProps {
  synthesis: string;
  coreObjective: string;
}

export function TaskOverview({ synthesis, coreObjective }: TaskOverviewProps) {
  return (
    <SummarySection icon={Network} title="Task Overview">
      <div className="space-y-4">
        <div>
          <h5 className="text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest mb-1.5">Context</h5>
          <p className="text-[13px] text-text-primary leading-relaxed">{synthesis}</p>
        </div>
        <div>
          <h5 className="text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest mb-1.5">What to Build</h5>
          <p className="text-[13px] text-text-secondary leading-relaxed">{coreObjective}</p>
        </div>
      </div>
    </SummarySection>
  );
}

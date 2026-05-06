import React from 'react';
import { SummarySection } from './SummarySection';

interface TaskOverviewProps {
  synthesis: string;
  coreObjective: string;
}

export function TaskOverview({ synthesis, coreObjective }: TaskOverviewProps) {
  return (
    <SummarySection title="Task Overview">
      <div className="space-y-3">
        <p className="leading-relaxed">{synthesis}</p>
        <p className="text-text-secondary leading-relaxed">{coreObjective}</p>
      </div>
    </SummarySection>
  );
}

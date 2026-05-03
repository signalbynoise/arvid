import React from 'react';
import { Settings } from 'lucide-react';
import { SummarySection } from './SummarySection';

interface ImplementationDetailsProps {
  architecture: string;
}

export function ImplementationDetails({ architecture }: ImplementationDetailsProps) {
  return (
    <SummarySection icon={Settings} title="Implementation Details" defaultOpen>
      <p className="text-[13px] text-text-secondary leading-relaxed">{architecture}</p>
    </SummarySection>
  );
}

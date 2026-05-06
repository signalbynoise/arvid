import React from 'react';
import { SummarySection } from './SummarySection';

interface ImplementationDetailsProps {
  architecture: string;
}

export function ImplementationDetails({ architecture }: ImplementationDetailsProps) {
  return (
    <SummarySection title="Implementation Details">
      <p className="leading-relaxed">{architecture}</p>
    </SummarySection>
  );
}

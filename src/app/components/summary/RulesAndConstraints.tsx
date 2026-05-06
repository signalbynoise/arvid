import React from 'react';
import { SummarySection } from './SummarySection';

interface RulesAndConstraintsProps {
  constraints: string;
}

export function RulesAndConstraints({ constraints }: RulesAndConstraintsProps) {
  return (
    <SummarySection title="Rules and Constraints">
      <p className="leading-relaxed">{constraints}</p>
    </SummarySection>
  );
}

import React from 'react';
import { Shield } from 'lucide-react';
import { SummarySection } from './SummarySection';

interface RulesAndConstraintsProps {
  constraints: string;
}

export function RulesAndConstraints({ constraints }: RulesAndConstraintsProps) {
  return (
    <SummarySection icon={Shield} title="Rules & Constraints">
      <p className="text-[13px] text-text-secondary leading-relaxed">{constraints}</p>
    </SummarySection>
  );
}

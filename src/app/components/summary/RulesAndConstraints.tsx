import React from 'react';
import { Shield } from 'lucide-react';
import { SummarySection } from './SummarySection';

interface RulesAndConstraintsProps {
  constraints: string;
}

export function RulesAndConstraints({ constraints }: RulesAndConstraintsProps) {
  return (
    <SummarySection icon={Shield} title="Rules & Constraints">
      <p className="text-[13px] text-[#d0d6e0] leading-relaxed">{constraints}</p>
    </SummarySection>
  );
}

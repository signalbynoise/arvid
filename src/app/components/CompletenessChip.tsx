import React from 'react';
import { Chip } from './Chip';

interface CompletenessChipProps {
  value: number;
}

export function CompletenessChip({ value }: CompletenessChipProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <Chip border="gradient" gradientValue={clamped}>
      <span className="text-text-tertiary">{clamped}%</span>
    </Chip>
  );
}

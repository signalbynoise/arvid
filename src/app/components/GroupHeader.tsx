import React from 'react';
import { Chevron } from './Chevron';

interface GroupHeaderProps {
  label: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function GroupHeader({ label, count, isExpanded, onToggle }: GroupHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center text-label-upper text-text-tertiary hover:text-text-primary transition-colors"
    >
      <Chevron open={isExpanded} />
      <span>{label}</span>
      <span className="ml-2 text-text-quaternary bg-surface-frost-05 px-1.5 py-0.5 rounded-standard text-label">
        {count}
      </span>
    </button>
  );
}

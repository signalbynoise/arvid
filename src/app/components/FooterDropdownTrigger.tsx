import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FooterDropdownTriggerProps {
  onClick: () => void;
  disabled?: boolean;
  isOpen?: boolean;
  children: React.ReactNode;
}

export function FooterDropdownTrigger({ onClick, disabled = false, isOpen = false, children }: FooterDropdownTriggerProps) {
  const radiusClass = isOpen
    ? 'rounded-bl-comfortable rounded-br-comfortable'
    : 'rounded-comfortable';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between w-full p-3 bg-surface-panel border border-border-default ${radiusClass} text-label hover:border-border-hover transition-colors disabled:opacity-50`}
    >
      <span className="truncate">{children}</span>
      <ChevronDown size={14} className="text-text-quaternary shrink-0 ml-2" />
    </button>
  );
}

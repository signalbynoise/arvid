import React from 'react';

interface SuggestionActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

export function SuggestionAction({ icon, label, description, onClick }: SuggestionActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-comfortable text-left transition-colors bg-transparent hover:bg-surface-frost-04 group"
    >
      <span className="mt-0.5 text-text-quaternary group-hover:text-text-tertiary transition-colors shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-[var(--fw-medium)] text-text-tertiary group-hover:text-text-secondary transition-colors">
          {label}
        </p>
        <p className="text-[12px] text-text-empty group-hover:text-text-quaternary transition-colors">
          {description}
        </p>
      </div>
    </button>
  );
}

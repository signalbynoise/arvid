import React from 'react';
import { KeyboardShortcut } from './ui/KeyboardShortcut';

interface SuggestionActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  shortcut?: string;
  onClick: () => void;
}

export function SuggestionAction({ icon, label, description, shortcut, onClick }: SuggestionActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-comfortable text-left transition-colors bg-transparent hover:bg-surface-frost-04 group"
    >
      <span className="mt-0.5 text-text-quaternary group-hover:text-text-tertiary transition-colors shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-caption text-text-tertiary group-hover:text-text-secondary transition-colors">
          {label}
        </p>
        <p className="text-btn text-text-empty group-hover:text-text-quaternary transition-colors">
          {description}
        </p>
      </div>
      {shortcut && (
        <span className="mt-1">
          <KeyboardShortcut chord={shortcut} />
        </span>
      )}
    </button>
  );
}

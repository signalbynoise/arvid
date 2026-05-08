import React from 'react';

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function ActionRow({ icon, label, onClick, disabled = false }: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2 bg-surface-elevated border border-border-default rounded-comfortable p-3 text-btn text-text-tertiary cursor-pointer hover:bg-surface-frost-04 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

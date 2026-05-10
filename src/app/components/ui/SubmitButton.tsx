import React from 'react';
import { Command, CornerDownLeft } from 'lucide-react';

interface SubmitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
}

export function SubmitButton({ onClick, disabled, label, loadingLabel, isLoading }: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="btn-primary flex items-center gap-2"
    >
      <span className="flex items-center shrink-0">
        <Command size={14} />
        <CornerDownLeft size={14} />
      </span>
      <span>{isLoading ? (loadingLabel ?? label) : label}</span>
    </button>
  );
}

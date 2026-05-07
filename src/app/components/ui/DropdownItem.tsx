import React from 'react';

type DropdownItemVariant = 'default' | 'muted' | 'destructive';

const VARIANT_CLASSES: Record<DropdownItemVariant, string> = {
  default: 'text-text-tertiary hover:text-text-primary',
  muted: 'text-text-tertiary hover:text-text-primary',
  destructive: 'text-status-error hover:text-status-error',
};

interface DropdownItemProps {
  icon?: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: DropdownItemVariant;
  disabled?: boolean;
}

export function DropdownItem({
  icon,
  label,
  right,
  onClick,
  variant = 'default',
  disabled = false,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 w-full px-3 py-1 text-caption-lg cursor-pointer transition-colors text-left disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1 whitespace-nowrap">{label}</span>
      {right && <span className="shrink-0 ml-10">{right}</span>}
    </button>
  );
}

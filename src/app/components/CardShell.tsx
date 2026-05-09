import React from 'react';

type CardVariant = 'default' | 'selected' | 'suggested' | 'inactive';

interface CardShellProps {
  id?: string;
  variant?: CardVariant;
  dimmed?: boolean;
  interactive?: boolean;
  connectorLeft?: boolean;
  connectorRight?: boolean;
  hint?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const BASE = 'relative flex flex-col gap-4 p-4 rounded-comfortable border overflow-hidden transition-all duration-200 text-caption-lg';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-surface-elevated border-border-default hover:border-border-hover',
  selected: 'bg-surface-elevated border-border-focus shadow-card-selected',
  suggested: 'bg-surface-frost-03 border-dashed border-border-strong opacity-70 hover:opacity-100',
  inactive: 'bg-surface-elevated border-border-default opacity-60 hover:opacity-100',
};

const DIMMED = 'opacity-30 saturate-50 hover:opacity-100 hover:saturate-100';

export function CardShell({
  id,
  variant = 'default',
  dimmed = false,
  interactive = false,
  connectorLeft = false,
  connectorRight = false,
  hint = false,
  onClick,
  children,
}: CardShellProps) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`${interactive ? 'group cursor-pointer' : ''} ${BASE} ${VARIANT_CLASSES[variant]} ${dimmed ? DIMMED : ''} ${hint ? 'card-hint' : ''}`}
    >
      {connectorLeft && (
        <div className="absolute top-1/2 -left-4 w-4 h-[1px] bg-border-focus z-10" />
      )}
      {connectorRight && (
        <div className="absolute top-1/2 -right-4 w-4 h-[1px] bg-border-focus z-10" />
      )}
      {children}
    </div>
  );
}

import React from 'react';

interface MiniCardTitleProps {
  children: React.ReactNode;
  weight?: 'medium' | 'regular';
  muted?: boolean;
}

export function MiniCardTitle({ children, weight = 'medium', muted = false }: MiniCardTitleProps) {
  const weightClass = weight === 'medium' ? 'font-[var(--fw-medium)]' : 'font-[var(--fw-regular)]';
  const colorClass = muted ? 'text-text-quaternary' : 'text-text-primary';
  return <h4 className={`text-[9px] ${weightClass} ${colorClass} leading-tight`}>{children}</h4>;
}

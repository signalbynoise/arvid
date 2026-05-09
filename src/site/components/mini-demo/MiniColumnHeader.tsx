import React from 'react';

interface MiniColumnHeaderProps {
  title: string;
  trailing?: React.ReactNode;
}

export function MiniColumnHeader({ title, trailing }: MiniColumnHeaderProps) {
  return (
    <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
      <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">{title}</span>
      {trailing}
    </div>
  );
}

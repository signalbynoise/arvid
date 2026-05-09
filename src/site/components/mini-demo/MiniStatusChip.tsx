import React from 'react';

interface MiniStatusChipProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  borderClass?: string;
  children: React.ReactNode;
}

export function MiniStatusChip({ icon: Icon, iconColor = 'text-text-quaternary', borderClass = 'border-border-default', children }: MiniStatusChipProps) {
  return (
    <div className={`self-start flex items-center gap-1 px-1.5 py-0.5 rounded-micro border border-dashed text-[7px] font-[var(--fw-medium)] ${borderClass}`}>
      <Icon size={7} className={iconColor} />
      {children}
    </div>
  );
}

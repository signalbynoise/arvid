import React from 'react';

interface MiniShellProps {
  visible: boolean;
  className?: string;
  shadow?: boolean;
  roundedRight?: boolean;
  children: React.ReactNode;
}

export function MiniShell({ visible, className, shadow = true, roundedRight = true, children }: MiniShellProps) {
  const radiusClass = roundedRight ? 'rounded-[4px]' : 'rounded-l-[4px] rounded-r-none';

  return (
    <div className={`flex ${radiusClass} overflow-hidden border border-border-subtle bg-surface-base ${shadow ? 'shadow-elevated' : ''} transition-all duration-700 ${
      visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    } ${className ?? 'w-full h-full'}`}>
      {children}
    </div>
  );
}

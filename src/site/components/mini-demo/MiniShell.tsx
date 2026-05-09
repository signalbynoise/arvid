import React from 'react';

interface MiniShellProps {
  visible: boolean;
  className?: string;
  shadow?: boolean;
  roundedRight?: boolean;
  roundedBottom?: boolean;
  children: React.ReactNode;
}

export function MiniShell({ visible, className, shadow = true, roundedRight = true, roundedBottom = true, children }: MiniShellProps) {
  let radiusClass: string;
  if (!roundedBottom) {
    radiusClass = roundedRight ? 'rounded-t-standard rounded-b-none' : 'rounded-tl-standard rounded-tr-none rounded-b-none';
  } else {
    radiusClass = roundedRight ? 'rounded-standard' : 'rounded-l-standard rounded-r-none';
  }

  return (
    <div className={`flex ${radiusClass} overflow-hidden border border-border-subtle bg-surface-base ${shadow ? 'shadow-elevated' : ''} transition-all duration-700 ${
      visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    } ${className ?? 'w-full h-full'}`}>
      {children}
    </div>
  );
}

import React from 'react';

interface MiniCardHeaderProps {
  shortId: string;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}

export function MiniCardHeader({ shortId, trailing, children }: MiniCardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-[6px] font-mono text-text-quaternary">{shortId}</span>
        {children}
      </div>
      {trailing}
    </div>
  );
}

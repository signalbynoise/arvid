import React from 'react';

interface MiniCardMetaProps {
  text: string;
  children?: React.ReactNode;
}

export function MiniCardMeta({ text, children }: MiniCardMetaProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[6px] text-text-quaternary">{text}</span>
      {children && (
        <div className="flex items-center gap-1">{children}</div>
      )}
    </div>
  );
}

import React from 'react';

interface MiniBodyTextProps {
  children: React.ReactNode;
}

export function MiniBodyText({ children }: MiniBodyTextProps) {
  return <p className="text-[7px] text-text-primary leading-relaxed">{children}</p>;
}

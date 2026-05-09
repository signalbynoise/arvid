import React from 'react';

interface MiniCardBodyProps {
  children: React.ReactNode;
}

export function MiniCardBody({ children }: MiniCardBodyProps) {
  return <p className="text-[8px] text-text-primary leading-relaxed">{children}</p>;
}

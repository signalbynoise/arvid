import React from 'react';

interface MiniCategoryLabelProps {
  children: React.ReactNode;
}

export function MiniCategoryLabel({ children }: MiniCategoryLabelProps) {
  return <span className="text-[6px] font-mono text-text-quaternary uppercase">{children}</span>;
}

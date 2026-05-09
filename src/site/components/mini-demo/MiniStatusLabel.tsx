import React from 'react';

interface MiniStatusLabelProps {
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  children: React.ReactNode;
}

export function MiniStatusLabel({ active, activeClass, inactiveClass, children }: MiniStatusLabelProps) {
  return <span className={active ? activeClass : inactiveClass}>{children}</span>;
}

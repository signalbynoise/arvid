import React from 'react';

interface MiniSidebarFooterProps {
  children: React.ReactNode;
}

export function MiniSidebarFooter({ children }: MiniSidebarFooterProps) {
  return (
    <div className="shrink-0 py-2 space-y-2">
      {children}
    </div>
  );
}

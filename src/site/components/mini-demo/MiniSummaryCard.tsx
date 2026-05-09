import React from 'react';

interface MiniSummaryCardProps {
  children: React.ReactNode;
}

export function MiniSummaryCard({ children }: MiniSummaryCardProps) {
  return (
    <div className="bg-surface-elevated border border-border-default rounded-standard overflow-hidden">
      {children}
    </div>
  );
}

interface MiniSummaryCardContentProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export function MiniSummaryCardContent({ header, children }: MiniSummaryCardContentProps) {
  return (
    <MiniSummaryCard>
      <div className="p-2 flex flex-col gap-1">{header}</div>
      <div className="px-2 pb-2">{children}</div>
    </MiniSummaryCard>
  );
}

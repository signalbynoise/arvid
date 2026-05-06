import React from 'react';
import { Chevron } from '../Chevron';

interface SummarySectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SummarySection({ title, defaultOpen = false, children }: SummarySectionProps) {
  return (
    <details className="group border-b border-border-subtle last:border-0" open={defaultOpen}>
      <summary className="flex items-center justify-between cursor-pointer py-2 text-label text-text-tertiary hover:text-text-secondary transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <Chevron className="group-open:rotate-90" />
      </summary>
      <div className="pb-3 pt-1 text-label text-text-primary">
        {children}
      </div>
    </details>
  );
}

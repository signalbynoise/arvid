import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummarySectionProps {
  icon: LucideIcon;
  title: string;
  defaultOpen?: boolean;
  titleClassName?: string;
  children: React.ReactNode;
}

export function SummarySection({ icon: Icon, title, defaultOpen = false, titleClassName, children }: SummarySectionProps) {
  return (
    <details className="group border-b border-border-subtle last:border-0" open={defaultOpen}>
      <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-surface-frost-02 rounded-comfortable transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
        <h4 className={`text-[11px] font-[var(--fw-medium)] uppercase tracking-widest flex items-center space-x-1.5 ${titleClassName || 'text-text-secondary'}`}>
          <Icon size={12} className={titleClassName ? undefined : 'text-text-tertiary'} />
          <span>{title}</span>
        </h4>
        <svg className="w-3.5 h-3.5 text-text-quaternary transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="p-2 pt-1 pb-4">
        {children}
      </div>
    </details>
  );
}

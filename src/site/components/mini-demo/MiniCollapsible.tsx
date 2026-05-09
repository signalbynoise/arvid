import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MiniCollapsibleProps {
  title: string;
  open?: boolean;
  borderBottom?: boolean;
  children: React.ReactNode;
}

export function MiniCollapsible({ title, open = false, borderBottom = true, children }: MiniCollapsibleProps) {
  return (
    <details className={borderBottom ? 'border-b border-border-subtle' : ''} open={open || undefined}>
      <summary className="flex items-center justify-between cursor-pointer py-1.5 text-[7px] font-[var(--fw-medium)] text-text-tertiary outline-none list-none [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronRight size={7} className="text-text-quaternary transition-transform [details[open]>&]:rotate-90" />
      </summary>
      <div className="pb-2 pt-0.5">{children}</div>
    </details>
  );
}

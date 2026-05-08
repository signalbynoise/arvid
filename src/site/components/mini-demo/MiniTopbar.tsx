import { PanelLeft, Settings, ChevronRight } from 'lucide-react';
import type { BreadcrumbSegment } from './types';

interface MiniTopbarProps {
  segments: BreadcrumbSegment[];
}

export function MiniTopbar({ segments }: MiniTopbarProps) {
  return (
    <div className="border-b border-border-subtle flex items-center px-3 py-2 bg-surface-panel shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <PanelLeft size={10} className="text-text-tertiary shrink-0" />
        <div className="flex items-center gap-1 text-[7px] font-[var(--fw-medium)] text-text-tertiary min-w-0">
          {segments.map((seg, i) => {
            const Icon = seg.icon;
            const isLast = i === segments.length - 1;
            return (
              <span key={i} className="contents">
                {i > 0 && <ChevronRight size={7} className="text-text-quaternary shrink-0" />}
                {Icon && <Icon size={7} className="text-text-quaternary shrink-0" />}
                <span className={isLast ? 'truncate' : 'shrink-0'}>{seg.label}</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="ml-auto flex items-center shrink-0">
        <Settings size={10} className="text-text-quaternary" />
      </div>
    </div>
  );
}

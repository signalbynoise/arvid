import React from 'react';
import { MoreHorizontal, CircleDot } from 'lucide-react';
import type { SampleRequirement } from '../data/sampleRequirements';

function completenessColor(v: number): string {
  if (v >= 80) return 'border-status-success';
  if (v >= 50) return 'border-status-warning';
  return 'border-status-error';
}

const IMPL_COLORS: Record<string, string> = {
  'Implemented': 'text-status-success border-status-success-border',
  'Partially Implemented': 'text-status-warning border-status-warning-border',
  'Not Implemented': 'text-text-tertiary border-border-default',
};

const CLARITY_DOT: Record<string, string> = {
  High: 'bg-indicator-high',
  Medium: 'bg-indicator-medium',
  Low: 'bg-indicator-low',
};

const RISK_DOT: Record<string, string> = {
  Low: 'bg-indicator-high',
  Medium: 'bg-indicator-medium',
  High: 'bg-indicator-low',
};

export function RequirementCard({ shortId, title, owner, completeness, clarity, risk, linearStatus, implStatus }: SampleRequirement) {
  return (
    <div className="w-full h-full p-3 rounded-comfortable border border-border-default bg-surface-elevated flex flex-col gap-2.5 select-none pointer-events-none">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-text-quaternary">{shortId}</span>
        <MoreHorizontal size={10} className="text-text-quaternary opacity-50" />
      </div>

      <p className="text-[11px] font-[var(--fw-medium)] text-text-primary leading-tight line-clamp-2">
        {title}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <span className={`text-[8px] font-[var(--fw-medium)] text-text-tertiary px-1.5 py-0.5 rounded-micro border ${completenessColor(completeness)}`}>
          {completeness}%
        </span>
        {linearStatus && (
          <span className="flex items-center gap-0.5 text-[8px] font-[var(--fw-medium)] text-text-tertiary px-1.5 py-0.5 rounded-micro border border-dashed border-border-default">
            <CircleDot size={7} className="text-text-quaternary" />
            {linearStatus}
          </span>
        )}
        {implStatus && (
          <span className={`flex items-center gap-0.5 text-[8px] font-[var(--fw-medium)] px-1.5 py-0.5 rounded-micro border border-dashed ${IMPL_COLORS[implStatus]}`}>
            <img src="/github.svg" alt="" className="w-[8px] h-[8px] shrink-0" />
            {implStatus}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-[9px] text-text-quaternary truncate">{owner}</span>
        <div className="flex items-center gap-1 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${CLARITY_DOT[clarity]}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[risk]}`} />
        </div>
      </div>
    </div>
  );
}

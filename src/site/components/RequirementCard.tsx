import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { SampleRequirement } from '../data/sampleRequirements';

const CLARITY_SCORE: Record<string, number> = { High: 8, Medium: 5, Low: 2 };
const RISK_SCORE: Record<string, number> = { Low: 2, Medium: 5, High: 8 };

const IMPL_COLORS: Record<string, string> = {
  'Implemented': 'text-status-success border-status-success-border',
  'Partially Implemented': 'text-status-warning border-status-warning-border',
  'Not Implemented': 'text-text-tertiary border-border-default',
};

const DEPLOY_COLORS: Record<string, string> = {
  'Live': 'text-status-success border-status-success-border',
  'Not Deployed': 'text-text-tertiary border-border-default',
  'Deploy Failed': 'text-status-error border-status-error-border',
};

export function RequirementCard({ shortId, title, owner, completeness, clarity, risk, linearStatus, implStatus, deployStatus }: SampleRequirement) {
  const c = CLARITY_SCORE[clarity] ?? 5;
  const r = RISK_SCORE[risk] ?? 5;

  return (
    <div className="w-full h-full p-3 rounded-comfortable border border-border-default bg-surface-elevated flex flex-col gap-2.5 select-none pointer-events-none">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-text-quaternary">
          {shortId} C{c} R{r} {completeness}%
        </span>
        <MoreHorizontal size={10} className="text-text-quaternary opacity-50" />
      </div>

      <p className="text-[11px] font-[var(--fw-medium)] text-text-primary leading-tight line-clamp-2">
        {title}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {linearStatus && (
          <span className="flex items-center gap-0.5 text-[8px] font-[var(--fw-medium)] text-text-tertiary px-1.5 py-0.5 rounded-micro border border-dashed border-border-default">
            <img src="/linear.svg" alt="" className="w-[7px] h-[7px] shrink-0 opacity-60" />
            {linearStatus}
          </span>
        )}
        {implStatus && (
          <span className={`flex items-center gap-0.5 text-[8px] font-[var(--fw-medium)] px-1.5 py-0.5 rounded-micro border border-dashed ${IMPL_COLORS[implStatus]}`}>
            <img src="/github.svg" alt="" className="w-[7px] h-[7px] shrink-0" />
            {implStatus}
          </span>
        )}
        {deployStatus && (
          <span className={`flex items-center gap-0.5 text-[8px] font-[var(--fw-medium)] px-1.5 py-0.5 rounded-micro border border-dashed ${DEPLOY_COLORS[deployStatus]}`}>
            <img src="/render.svg" alt="" className="w-[7px] h-[7px] shrink-0" />
            {deployStatus}
          </span>
        )}
      </div>

      <div className="flex items-center mt-auto">
        <span className="text-[9px] text-text-quaternary truncate">{owner}</span>
      </div>
    </div>
  );
}

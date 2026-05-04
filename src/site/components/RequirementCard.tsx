import React from 'react';
import { User } from 'lucide-react';
import type { SampleRequirement } from '../data/sampleRequirements';

const COMPLETENESS_COLOR = (v: number) =>
  v >= 80 ? 'bg-status-success' : v >= 50 ? 'bg-status-warning' : 'bg-status-error';

const CLARITY_COLOR: Record<string, string> = {
  High: 'bg-status-success',
  Medium: 'bg-status-warning',
  Low: 'bg-status-error',
};

const RISK_COLOR: Record<string, string> = {
  Low: 'bg-status-success',
  Medium: 'bg-status-warning',
  High: 'bg-status-error',
};

export function RequirementCard({ title, owner, completeness, clarity, risk }: SampleRequirement) {
  return (
    <div className="w-full h-full p-3 rounded-card border border-border-default bg-surface-frost-02 flex flex-col justify-between select-none pointer-events-none">
      <div>
        <h3 className="font-[var(--fw-medium)] text-text-primary text-[11px] leading-tight tracking-[-0.165px] line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center text-[10px] text-text-tertiary mt-1.5 gap-1">
          <User size={10} className="opacity-70 shrink-0" />
          <span className="truncate">{owner}</span>
        </div>
      </div>

      <div className="flex items-end justify-between text-[9px] mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-text-quaternary font-[var(--fw-regular)]">Completeness</span>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-1 bg-surface-frost-10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${COMPLETENESS_COLOR(completeness)}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="font-[var(--fw-medium)] text-text-secondary">{completeness}%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-text-quaternary font-[var(--fw-regular)]">Clarity</span>
            <div className={`w-1.5 h-1.5 rounded-full ${CLARITY_COLOR[clarity]}`} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-text-quaternary font-[var(--fw-regular)]">Risk</span>
            <div className={`w-1.5 h-1.5 rounded-full ${RISK_COLOR[risk]}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

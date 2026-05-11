import { MoreHorizontal, CircleDot } from 'lucide-react';
import { MiniCard } from '../mini-demo/MiniCard';
import { MiniCardHeader } from '../mini-demo/MiniCardHeader';
import { MiniCardTitle } from '../mini-demo/MiniCardTitle';
import { MiniCardMeta } from '../mini-demo/MiniCardMeta';
import { MiniIndicatorDot } from '../mini-demo/MiniIndicatorDot';
import type { Requirement } from './types';

interface RequirementCardProps {
  req: Requirement;
  selected: boolean;
  visible: boolean;
  dimmed: boolean;
  implChipTarget?: string;
}

const CLARITY_COLORS: Record<string, string> = {
  High: 'bg-indicator-high',
  Medium: 'bg-indicator-medium',
  Low: 'bg-indicator-low',
};

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-indicator-high',
  Medium: 'bg-indicator-medium',
  High: 'bg-indicator-low',
};

const IMPL_CHIP_STYLES: Record<string, { color: string; iconColor: string; borderClass: string }> = {
  Implemented: {
    color: 'text-status-success',
    iconColor: 'text-status-success',
    borderClass: 'border-status-success-border',
  },
  'Not implemented': {
    color: 'text-text-tertiary',
    iconColor: 'text-text-quaternary',
    borderClass: 'border-border-default',
  },
  'Partially implemented': {
    color: 'text-status-warning',
    iconColor: 'text-status-warning',
    borderClass: 'border-status-warning-border',
  },
};

const DEFAULT_IMPL_STYLE = IMPL_CHIP_STYLES['Not implemented'];

export function RequirementCard({ req, selected, visible, dimmed, implChipTarget }: RequirementCardProps) {
  const implStyle = req.implStatus ? (IMPL_CHIP_STYLES[req.implStatus] ?? DEFAULT_IMPL_STYLE) : null;

  return (
    <MiniCard
      visible={visible}
      emphasis={selected}
      dimmed={dimmed}
      connectors={selected ? ['right'] : []}
    >
      <MiniCardHeader
        shortId={req.shortId}
        trailing={<MoreHorizontal size={8} className="text-text-quaternary" />}
      />
      <MiniCardTitle>{req.title}</MiniCardTitle>

      <div className="flex flex-wrap gap-1">
        <div className="flex items-center px-1.5 py-0.5 rounded-micro border border-border-default bg-surface-frost-08">
          <span className="text-[7px] text-text-tertiary">{req.completeness}%</span>
        </div>
        {req.status && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-micro border border-dashed border-border-default">
            <CircleDot size={7} className="text-text-quaternary" />
            <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">{req.status}</span>
          </div>
        )}
        {req.implStatus && implStyle && (
          <div data-cursor-target={implChipTarget} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-micro border border-dashed ${implStyle.borderClass}`}>
            <img src="/github.svg" alt="" className="w-[7px] h-[7px] shrink-0" />
            <span className={`text-[7px] font-[var(--fw-medium)] ${implStyle.color}`}>{req.implStatus}</span>
          </div>
        )}
      </div>

      <MiniCardMeta text={`${req.owner} - ${req.createdAt}`}>
        <MiniIndicatorDot color={CLARITY_COLORS[req.clarity]} title={`Clarity: ${req.clarity}`} />
        <MiniIndicatorDot color={RISK_COLORS[req.risk]} title={`Risk: ${req.risk}`} />
      </MiniCardMeta>
    </MiniCard>
  );
}

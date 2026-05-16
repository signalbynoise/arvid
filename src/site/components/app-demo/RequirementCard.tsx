import { MoreHorizontal } from 'lucide-react';
import { MiniCard } from '../mini-demo/MiniCard';
import { MiniCardHeader } from '../mini-demo/MiniCardHeader';
import { MiniCardTitle } from '../mini-demo/MiniCardTitle';
import { MiniCardMeta } from '../mini-demo/MiniCardMeta';
import type { Requirement } from './types';

interface RequirementCardProps {
  req: Requirement;
  selected: boolean;
  visible: boolean;
  dimmed: boolean;
  implChipTarget?: string;
  deployChipTarget?: string;
}

const CLARITY_SCORE: Record<string, number> = { High: 8, Medium: 5, Low: 2 };
const RISK_SCORE: Record<string, number> = { Low: 2, Medium: 5, High: 8 };

const IMPL_CHIP_STYLES: Record<string, { color: string; borderClass: string }> = {
  Implemented: {
    color: 'text-status-success',
    borderClass: 'border-status-success-border',
  },
  'Not implemented': {
    color: 'text-text-tertiary',
    borderClass: 'border-border-default',
  },
  'Partially implemented': {
    color: 'text-status-warning',
    borderClass: 'border-status-warning-border',
  },
};

const DEPLOY_CHIP_STYLES: Record<string, { color: string; borderClass: string }> = {
  Live: {
    color: 'text-status-success',
    borderClass: 'border-status-success-border',
  },
  'Not deployed': {
    color: 'text-text-tertiary',
    borderClass: 'border-border-default',
  },
  'Deploy failed': {
    color: 'text-status-error',
    borderClass: 'border-status-error-border',
  },
};

const DEFAULT_IMPL_STYLE = IMPL_CHIP_STYLES['Not implemented'];
const DEFAULT_DEPLOY_STYLE = DEPLOY_CHIP_STYLES['Not deployed'];

export function RequirementCard({ req, selected, visible, dimmed, implChipTarget, deployChipTarget }: RequirementCardProps) {
  const implStyle = req.implStatus ? (IMPL_CHIP_STYLES[req.implStatus] ?? DEFAULT_IMPL_STYLE) : null;
  const deployStyle = req.deployStatus ? (DEPLOY_CHIP_STYLES[req.deployStatus] ?? DEFAULT_DEPLOY_STYLE) : null;
  const c = CLARITY_SCORE[req.clarity] ?? 5;
  const r = RISK_SCORE[req.risk] ?? 5;

  return (
    <MiniCard
      visible={visible}
      emphasis={selected}
      dimmed={dimmed}
      connectors={selected ? ['right'] : []}
    >
      <MiniCardHeader
        shortId={`${req.shortId} C${c} R${r} ${req.completeness}%`}
        trailing={<MoreHorizontal size={8} className="text-text-quaternary" />}
      />
      <MiniCardTitle>{req.title}</MiniCardTitle>

      <div className="flex flex-wrap gap-1">
        {req.status && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-micro border border-dashed border-border-default">
            <img src="/linear.svg" alt="" className="w-[7px] h-[7px] shrink-0 opacity-60" />
            <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">{req.status}</span>
          </div>
        )}
        {req.implStatus && implStyle && (
          <div data-cursor-target={implChipTarget} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-micro border border-dashed ${implStyle.borderClass}`}>
            <img src="/github.svg" alt="" className="w-[7px] h-[7px] shrink-0" />
            <span className={`text-[7px] font-[var(--fw-medium)] ${implStyle.color}`}>{req.implStatus}</span>
          </div>
        )}
        {req.deployStatus && deployStyle && (
          <div data-cursor-target={deployChipTarget} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-micro border border-dashed ${deployStyle.borderClass}`}>
            <img src="/render.svg" alt="" className="w-[7px] h-[7px] shrink-0" />
            <span className={`text-[7px] font-[var(--fw-medium)] ${deployStyle.color}`}>{req.deployStatus}</span>
          </div>
        )}
      </div>

      <MiniCardMeta text={`${req.owner} - ${req.createdAt}`} />
    </MiniCard>
  );
}

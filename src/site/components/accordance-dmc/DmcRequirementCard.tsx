import { MoreHorizontal } from 'lucide-react';

interface DmcRequirementCardProps {
  shortId: string;
  title: string;
  completeness: number;
  clarityScore: number;
  riskScore: number;
  status: string;
  implStatus: string;
  deployStatus?: string;
  owner: string;
  visible: boolean;
  implChipTarget?: string;
  deployChipTarget?: string;
}

export function DmcRequirementCard({ shortId, title, completeness, clarityScore, riskScore, status, implStatus, deployStatus, owner, visible, implChipTarget, deployChipTarget }: DmcRequirementCardProps) {
  return (
    <div className={`bg-surface-elevated rounded-comfortable p-4 flex flex-col gap-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-tiny font-mono text-text-quaternary">
            {shortId} C{clarityScore} R{riskScore} {completeness}%
          </span>
          <MoreHorizontal size={16} className="text-text-quaternary" />
        </div>
        <p className="text-caption-lg text-text-primary">{title}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-standard border border-dashed border-border-default">
          <img src="/linear.svg" alt="" className="w-3 h-3 shrink-0 opacity-60" />
          <span className="text-tiny text-text-tertiary">{status}</span>
        </div>
        <div data-cursor-target={implChipTarget} className="flex items-center gap-2 px-2 py-1.5 rounded-standard border border-dashed border-border-default">
          <img src="/github.svg" alt="" className="w-3 h-3 shrink-0" />
          <span className="text-tiny text-text-tertiary">{implStatus}</span>
        </div>
        {deployStatus && (
          <div data-cursor-target={deployChipTarget} className="flex items-center gap-2 px-2 py-1.5 rounded-standard border border-dashed border-border-default">
            <img src="/render.svg" alt="" className="w-3 h-3 shrink-0" />
            <span className="text-tiny text-text-tertiary">{deployStatus}</span>
          </div>
        )}
      </div>

      <div className="flex items-center">
        <span className="text-[12px] font-[var(--fw-medium)] text-text-quaternary">{owner}</span>
      </div>
    </div>
  );
}

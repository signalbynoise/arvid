import { MoreHorizontal, CircleDot } from 'lucide-react';

interface DmcRequirementCardProps {
  shortId: string;
  title: string;
  completeness: number;
  status: string;
  implStatus: string;
  owner: string;
  visible: boolean;
  implChipTarget?: string;
}

export function DmcRequirementCard({ shortId, title, completeness, status, implStatus, owner, visible, implChipTarget }: DmcRequirementCardProps) {
  return (
    <div className={`bg-surface-elevated rounded-comfortable p-4 flex flex-col gap-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-tiny font-mono text-text-quaternary">{shortId}</span>
          <MoreHorizontal size={16} className="text-text-quaternary" />
        </div>
        <p className="text-caption-lg text-text-primary">{title}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center px-2 py-1.5 rounded-standard border border-border-default bg-surface-frost-08">
          <span className="text-tiny text-text-tertiary">{completeness}%</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-standard border border-dashed border-border-default">
          <CircleDot size={12} className="text-text-quaternary" />
          <span className="text-tiny text-text-tertiary">{status}</span>
        </div>
        <div data-cursor-target={implChipTarget} className="flex items-center gap-2 px-2 py-1.5 rounded-standard border border-dashed border-border-default">
          <img src="/github.svg" alt="" className="w-3 h-3 shrink-0" />
          <span className="text-tiny text-text-tertiary">{implStatus}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-[var(--fw-medium)] text-text-quaternary">{owner}</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-indicator-high" />
          <div className="w-2 h-2 rounded-full bg-indicator-medium" />
        </div>
      </div>
    </div>
  );
}

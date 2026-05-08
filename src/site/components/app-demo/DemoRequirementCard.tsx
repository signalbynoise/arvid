import type { Requirement } from './types';

interface DemoRequirementCardProps {
  req: Requirement;
  selected: boolean;
  visible: boolean;
  dimmed: boolean;
}

export function DemoRequirementCard({ req, selected, visible, dimmed }: DemoRequirementCardProps) {
  const clarityClass = req.clarity === 'High' ? 'bg-indicator-high' : req.clarity === 'Medium' ? 'bg-indicator-medium' : 'bg-indicator-low';
  const riskClass = req.risk === 'Low' ? 'bg-indicator-high' : req.risk === 'Medium' ? 'bg-indicator-medium' : 'bg-indicator-low';
  const chipColor = req.completeness >= 80 ? 'var(--status-success)' : req.completeness >= 50 ? 'var(--status-warning)' : 'var(--status-error)';

  return (
    <div className={`relative flex flex-col gap-2 p-2 rounded-[3px] border overflow-hidden transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    } ${selected
        ? 'bg-surface-frost-03 border-border-hover'
        : 'bg-surface-elevated border-border-default'
    } ${dimmed ? 'opacity-30 saturate-50' : ''}`}>
      {selected && (
        <div className="absolute top-1/2 -right-2 w-2 h-[1px] bg-border-focus z-10" />
      )}

      <div className="flex items-center justify-between">
        <span className="text-[6px] font-mono text-text-quaternary">{req.shortId}</span>
      </div>

      <h4 className="text-[8px] font-[var(--fw-medium)] text-text-primary leading-tight">{req.title}</h4>

      <div
        className="self-start flex items-center p-px rounded-[1px]"
        style={{ background: `conic-gradient(${chipColor} 0% ${req.completeness}%, var(--border-default) ${req.completeness}% 100%)` }}
      >
        <div className="px-1.5 py-0.5 bg-surface-elevated rounded-[1px] flex items-center">
          <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">{req.completeness}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[6px] text-text-quaternary">{req.owner} - {req.createdAt}</span>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${clarityClass}`} title={`Clarity: ${req.clarity}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${riskClass}`} title={`Risk: ${req.risk}`} />
        </div>
      </div>
    </div>
  );
}

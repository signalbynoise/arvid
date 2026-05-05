import { User } from 'lucide-react';
import type { Requirement } from './types';

interface DemoRequirementCardProps {
  req: Requirement;
  selected: boolean;
  visible: boolean;
  dimmed: boolean;
}

export function DemoRequirementCard({ req, selected, visible, dimmed }: DemoRequirementCardProps) {
  const clarityColor = req.clarity === 'High' ? 'bg-status-success' : req.clarity === 'Medium' ? 'bg-status-warning' : 'bg-status-error';
  const riskColor = req.risk === 'Low' ? 'bg-status-success' : req.risk === 'Medium' ? 'bg-status-warning' : 'bg-status-error';
  const barColor = req.completeness >= 80 ? 'bg-status-success' : req.completeness >= 50 ? 'bg-status-warning' : 'bg-status-error';

  return (
    <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    } ${selected ? 'bg-surface-frost-05' : 'bg-surface-frost-02'} ${
      dimmed ? 'opacity-30' : ''
    }`}>
      <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight mb-1.5">{req.title}</h4>
      <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
        <User size={8} className="opacity-70" />
        <span>{req.owner}</span>
      </div>
      <div className="flex items-center justify-between text-[7px]">
        <div className="flex items-center space-x-1.5">
          <div className="w-8 h-1 bg-surface-frost-10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${req.completeness}%` }} />
          </div>
          <span className="text-text-secondary font-[var(--fw-medium)]">{req.completeness}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${clarityColor}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${riskColor}`} />
        </div>
      </div>
    </div>
  );
}

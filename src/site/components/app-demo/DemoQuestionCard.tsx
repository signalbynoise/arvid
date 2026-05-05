import { Check, X, CheckCircle2, CircleDashed, LoaderPinwheel } from 'lucide-react';
import type { Question } from './types';

interface DemoQuestionCardProps {
  q: Question;
  visible: boolean;
  selected?: boolean;
  suggested?: boolean;
}

export function DemoQuestionCard({ q, visible, selected = false, suggested = false }: DemoQuestionCardProps) {
  const StatusIcon = q.status === 'Answered' ? CheckCircle2 : CircleDashed;
  const statusColor = q.status === 'Answered' ? 'text-status-success' : 'text-status-error';
  const statusBg = q.status === 'Answered' ? 'bg-status-success-surface border-status-success-border' : 'bg-status-error-surface border-status-error-border';

  if (suggested) {
    return (
      <div className={`p-2.5 rounded-md border border-dashed border-border-strong bg-surface-frost-01 transition-all duration-500 ${
        visible ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-3'
      }`}>
        <div className="flex items-center mb-1.5">
          <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1 py-0.5 rounded-sm uppercase tracking-wider border border-border-subtle">AI Suggestion</span>
        </div>
        <h4 className="text-[9px] font-[var(--fw-regular)] text-text-tertiary leading-snug mb-2">{q.text}</h4>
        <div className="flex items-center space-x-1.5">
          <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-08 text-text-primary rounded-sm text-[7px] font-[var(--fw-medium)]">
            <Check size={6} />
            <span>Use</span>
          </div>
          <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-05 text-text-tertiary rounded-sm text-[7px] font-[var(--fw-medium)]">
            <X size={6} />
            <span>Hide</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
    } ${selected ? 'bg-surface-frost-05' : 'bg-surface-frost-02'}`}>
      <h4 className="text-[9px] font-[var(--fw-regular)] text-text-primary leading-snug mb-2">{q.text}</h4>
      <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
        <LoaderPinwheel size={8} className="opacity-70" />
        <span>Arvid</span>
      </div>
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-sm border text-[7px] font-[var(--fw-medium)] ${statusColor} ${statusBg}`}>
          <StatusIcon size={7} />
          <span>{q.status}</span>
        </div>
        <span className="text-[7px] text-text-quaternary uppercase tracking-wider font-[var(--fw-medium)]">{q.category}</span>
      </div>
    </div>
  );
}

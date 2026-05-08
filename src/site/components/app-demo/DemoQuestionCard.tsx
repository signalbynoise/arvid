import { LoaderPinwheel } from 'lucide-react';
import type { Question } from './types';

interface DemoQuestionCardProps {
  q: Question;
  visible: boolean;
  selected?: boolean;
  suggested?: boolean;
}

export function DemoQuestionCard({ q, visible, selected = false, suggested = false }: DemoQuestionCardProps) {
  const importanceClass = q.importance === 'Critical' ? 'bg-indicator-high' : q.importance === 'Important' ? 'bg-indicator-medium' : 'bg-indicator-low';
  const statusAccent = q.status === 'Answered' ? 'border-status-success' : 'border-border-default';

  if (suggested) {
    return (
      <div className={`relative flex flex-col gap-2 p-2 rounded-[3px] border border-dashed border-border-strong bg-surface-frost-03 transition-all duration-500 ${
        visible ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-3'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[6px] font-mono text-text-quaternary">{q.shortId}</span>
        </div>

        <h4 className="text-[8px] font-[var(--fw-regular)] text-text-quaternary leading-snug">{q.text}</h4>

        <div className="flex items-center gap-1">
          <button className="flex-1 py-0.5 flex items-center justify-center bg-surface-frost-08 text-text-primary rounded-[1px] text-[7px] font-[var(--fw-medium)]">
            Use
          </button>
          <button className="flex-1 py-0.5 flex items-center justify-center bg-surface-frost-05 text-text-tertiary rounded-[1px] text-[7px] font-[var(--fw-medium)]">
            Hide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col gap-2 p-2 rounded-[3px] border overflow-hidden transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
    } ${selected
        ? 'bg-surface-frost-03 border-border-hover'
        : 'bg-surface-elevated border-border-default'
    }`}>
      {selected && (
        <>
          <div className="absolute top-1/2 -left-2 w-2 h-[1px] bg-border-focus z-10" />
          <div className="absolute top-1/2 -right-2 w-2 h-[1px] bg-border-focus z-10" />
        </>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[6px] font-mono text-text-quaternary">{q.shortId}</span>
          <span className="text-[6px] font-mono text-text-quaternary uppercase">{q.category}</span>
        </div>
      </div>

      <h4 className="text-[8px] font-[var(--fw-regular)] text-text-primary leading-snug">{q.text}</h4>

      <div className={`self-start flex items-center gap-1 px-1.5 py-0.5 rounded-[1px] border border-dashed text-[7px] font-[var(--fw-medium)] ${statusAccent}`}>
        <LoaderPinwheel size={7} className={q.status === 'Answered' ? 'text-status-success' : 'text-text-quaternary'} />
        <span className={q.status === 'Answered' ? 'text-status-success' : 'text-text-tertiary'}>{q.status}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[6px] text-text-quaternary">{q.author} - {q.createdAt}</span>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${importanceClass}`} title={q.importance} />
        </div>
      </div>
    </div>
  );
}

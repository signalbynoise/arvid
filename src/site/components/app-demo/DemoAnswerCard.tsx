import { LoaderPinwheel } from 'lucide-react';
import type { Answer } from './types';

interface DemoAnswerCardProps {
  answer: Answer;
  visible: boolean;
}

export function DemoAnswerCard({ answer, visible }: DemoAnswerCardProps) {
  return (
    <div className={`relative flex flex-col gap-2 p-2 rounded-[3px] border overflow-hidden transition-all duration-500 ${
      visible ? 'translate-y-0' : 'translate-y-3'
    } ${visible ? (answer.isCurrent ? 'opacity-100' : 'opacity-60') : 'opacity-0'} ${
      answer.isCurrent
        ? 'bg-surface-frost-03 border-border-hover'
        : 'bg-surface-elevated border-border-default'
    }`}>
      <div className="absolute top-1/2 -left-2 w-2 h-[1px] bg-border-focus z-10" />

      <div className="flex items-center justify-between">
        <span className="text-[6px] font-mono text-text-quaternary">{answer.shortId}</span>
      </div>

      <p className="text-[8px] text-text-primary leading-relaxed">{answer.text}</p>

      <div className={`self-start flex items-center gap-1 px-1.5 py-0.5 rounded-[1px] border border-dashed text-[7px] font-[var(--fw-medium)] border-border-default`}>
        <LoaderPinwheel size={7} className={answer.isCurrent ? 'text-text-primary' : 'text-text-quaternary'} />
        <span className={answer.isCurrent ? 'text-text-primary' : 'text-text-tertiary'}>
          {answer.isCurrent ? 'Active Answer' : 'Mark Active'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[6px] text-text-quaternary">{answer.author} - {answer.date}</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indicator-high" />
        </div>
      </div>
    </div>
  );
}

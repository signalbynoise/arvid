import { User, Clock, Check } from 'lucide-react';
import type { Answer } from './types';

interface DemoAnswerCardProps {
  answer: Answer;
  visible: boolean;
}

export function DemoAnswerCard({ answer, visible }: DemoAnswerCardProps) {
  return (
    <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
      visible ? (answer.isCurrent ? 'opacity-100' : 'opacity-70') : 'opacity-0'
    } ${visible ? 'translate-y-0' : 'translate-y-3'} ${answer.isCurrent ? 'bg-surface-frost-05' : 'bg-surface-frost-02'}`}>
      <div className="flex items-center space-x-2 text-[8px] text-text-tertiary mb-1.5">
        <div className="flex items-center space-x-1">
          <User size={7} />
          <span className="font-[var(--fw-medium)] text-text-secondary">{answer.author}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock size={7} />
          <span>{answer.date}</span>
        </div>
      </div>
      <p className="text-[8px] text-text-primary leading-relaxed mb-2">{answer.text}</p>
      <div className="border-t border-border-subtle pt-1.5">
        <div className={`inline-flex items-center space-x-1 text-[7px] font-[var(--fw-medium)] px-1.5 py-0.5 rounded-sm border border-border-subtle ${
          answer.isCurrent ? 'bg-surface-frost-08 text-text-primary' : 'bg-surface-frost-02 text-text-tertiary'
        }`}>
          <Check size={6} />
          <span>{answer.isCurrent ? 'Active' : 'Mark Active'}</span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Answer } from '../types';
import { Check, X, LoaderPinwheel, Clock } from 'lucide-react';

interface Props {
  answer: Answer;
  onUse: (id: string) => void;
  onHide: (id: string) => void;
}

export function SuggestedAnswerCard({ answer, onUse, onHide }: Props) {
  return (
    <div
      id={`answer-${answer.id}`}
      className="relative z-[1] p-4 rounded-card border border-dashed border-border-strong bg-surface-frost-01 opacity-70 hover:opacity-100 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1.5 py-0.5 rounded-standard uppercase tracking-wider border border-border-subtle">
          AI Suggestion
        </span>
      </div>

      <p className="text-[14px] text-text-tertiary mb-4 leading-relaxed">{answer.text}</p>

      <div className="flex items-center text-[12px] text-text-tertiary mb-3 space-x-3">
        <div className="flex items-center space-x-1.5">
          <LoaderPinwheel size={13} className="opacity-70" />
          <span className="font-[var(--fw-medium)] text-text-secondary">Arvid</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Clock size={13} />
          <span>{answer.date}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full pt-2">
        <button
          onClick={() => onUse(answer.id)}
          className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 bg-surface-frost-08 hover:bg-surface-frost-12 text-text-primary rounded-standard text-[11px] font-[var(--fw-medium)] transition-colors"
        >
          <Check size={12} />
          <span>Use Answer</span>
        </button>
        <button
          onClick={() => onHide(answer.id)}
          className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 bg-surface-frost-05 hover:bg-surface-frost-10 text-text-tertiary hover:text-text-primary rounded-standard text-[11px] font-[var(--fw-medium)] transition-colors"
        >
          <X size={12} />
          <span>Hide</span>
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Sparkles } from 'lucide-react';
import { SummarySection } from './SummarySection';
import { Question, Answer } from '../../types';

interface KnowledgeGraphProps {
  requirementOwner: string;
  questions: Question[];
  answers: Answer[];
}

export function KnowledgeGraph({ requirementOwner, questions, answers }: KnowledgeGraphProps) {
  const requestAuthor = requirementOwner || 'System';
  const qAuthors = Array.from(new Set(questions.map(q => q.author).filter(Boolean))) as string[];
  const ansAuthors = Array.from(new Set(answers.map(a => a.author).filter(Boolean))) as string[];

  return (
    <SummarySection icon={Sparkles} title="Knowledge Graph & Authors">
      <div>
        <h5 className="text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest mb-3">Context Chain</h5>
        <div className="relative pl-4 border-l border-border-strong space-y-4 ml-2">
          
          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-border-focus border-2 border-surface-panel" />
            <div className="flex items-center space-x-2 mb-0.5">
              <div className="w-4 h-4 rounded-full bg-surface-frost-05 border border-border-strong flex items-center justify-center text-[8px] font-[var(--fw-medium)] text-text-secondary">
                {requestAuthor.charAt(0).toUpperCase()}
              </div>
              <span className="text-[12px] font-[var(--fw-medium)] text-text-primary">Request Author</span>
            </div>
            <p className="text-[11px] text-text-tertiary leading-relaxed">{requestAuthor} &bull; Defined initial spec</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-border-focus border-2 border-surface-panel" />
            <div className="flex items-center space-x-2 mb-0.5">
              <div className="flex -space-x-1">
                {qAuthors.length > 0 ? qAuthors.slice(0, 3).map((a, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-surface-frost-05 border border-border-strong flex items-center justify-center text-[8px] font-[var(--fw-medium)] text-text-secondary z-10">
                    {a.charAt(0).toUpperCase()}
                  </div>
                )) : (
                  <div className="w-4 h-4 rounded-full bg-surface-frost-05 border border-border-strong flex items-center justify-center text-[8px] font-[var(--fw-medium)] text-text-secondary z-10">A</div>
                )}
              </div>
              <span className="text-[12px] font-[var(--fw-medium)] text-text-primary">Question Authors</span>
            </div>
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              {qAuthors.length > 0 ? qAuthors.join(', ') : 'Arvid (AI)'} &bull; Raised {questions.length} questions
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-border-focus border-2 border-surface-panel" />
            <div className="flex items-center space-x-2 mb-0.5">
              <div className="flex -space-x-1">
                {ansAuthors.length > 0 ? ansAuthors.slice(0, 3).map((a, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-surface-frost-05 border border-border-strong flex items-center justify-center text-[8px] font-[var(--fw-medium)] text-text-secondary z-10">
                    {a.charAt(0).toUpperCase()}
                  </div>
                )) : (
                  <div className="w-4 h-4 rounded-full bg-surface-frost-05 border border-border-strong flex items-center justify-center text-[8px] font-[var(--fw-medium)] text-text-secondary z-10">?</div>
                )}
              </div>
              <span className="text-[12px] font-[var(--fw-medium)] text-text-primary">Answer Authors</span>
            </div>
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              {ansAuthors.length > 0 ? ansAuthors.join(', ') : 'No answers yet'} &bull; Provided resolutions
            </p>
          </div>

        </div>
      </div>
    </SummarySection>
  );
}

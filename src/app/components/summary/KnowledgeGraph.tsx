import React from 'react';
import { SummarySection } from './SummarySection';
import { Question, Answer } from '../../types';

interface KnowledgeGraphProps {
  requirementOwner: string;
  questions: Question[];
  answers: Answer[];
}

export function KnowledgeGraph({ requirementOwner, questions, answers }: KnowledgeGraphProps) {
  const qAuthors = Array.from(new Set(questions.map(q => q.author).filter(Boolean))) as string[];
  const ansAuthors = Array.from(new Set(answers.map(a => a.author).filter(Boolean))) as string[];

  return (
    <SummarySection title="Knowledge Graph">
      <div className="space-y-2">
        <p>{requirementOwner || 'System'} &bull; Defined initial spec</p>
        <p>{qAuthors.length > 0 ? qAuthors.join(', ') : 'Arvid (AI)'} &bull; {questions.length} questions</p>
        <p>{ansAuthors.length > 0 ? ansAuthors.join(', ') : 'No answers yet'} &bull; Provided resolutions</p>
      </div>
    </SummarySection>
  );
}

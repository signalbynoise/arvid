import React from 'react';
import { MoreHorizontal, LoaderPinwheel } from 'lucide-react';
import { CardShell } from './CardShell';
import { CardHeader } from './ui/CardHeader';
import { CardBody } from './ui/CardBody';
import { CardFooter } from './ui/CardFooter';
import { Chip } from './Chip';
import { formatCardDate } from '../lib/formatDate';
import type { Answer } from '../types';

interface AnswerCardProps {
  answer: Answer;
  onToggleActive: (id: string) => void;
}

export function AnswerCard({ answer: ans, onToggleActive }: AnswerCardProps) {
  return (
    <CardShell
      id={`answer-${ans.id}`}
      variant={ans.isCurrent ? 'selected' : 'inactive'}
      connectorLeft
    >
      <CardHeader
        shortId={ans.shortId}
        actions={
          <button className="p-1 rounded-standard text-text-quaternary hover:text-text-primary hover:bg-surface-frost-08 transition-all">
            <MoreHorizontal size={14} />
          </button>
        }
      />

      <CardBody>
        <p>{ans.text}</p>
      </CardBody>

      <Chip border="dashed" onClick={(e) => { e.stopPropagation(); onToggleActive(ans.id); }}>
        <LoaderPinwheel size={14} className={ans.isCurrent ? 'text-text-primary' : 'text-text-quaternary'} />
        <span className={ans.isCurrent ? 'text-text-primary' : 'text-text-tertiary'}>
          {ans.isCurrent ? 'Active Answer' : 'Mark Active'}
        </span>
      </Chip>

      <CardFooter
        meta={`${ans.author} - ${formatCardDate(ans.date)}`}
        indicators={<div className="w-2 h-2 rounded-full bg-indicator-high" />}
      />
    </CardShell>
  );
}

import React from 'react';
import { MoreHorizontal, LoaderPinwheel } from 'lucide-react';
import { CardShell } from './CardShell';
import { CardHeader } from './ui/CardHeader';
import { CardBody } from './ui/CardBody';
import { CardFooter } from './ui/CardFooter';
import { Chip } from './Chip';
import { Button } from './Button';
import { formatCardDate } from '../lib/formatDate';
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onUseSuggestion: (id: string) => void;
  onHideSuggestion: (id: string) => void;
}

export function QuestionCard({ question: q, isSelected, isDimmed, onSelect, onOpenDetails, onUseSuggestion, onHideSuggestion }: QuestionCardProps) {
  const isSuggested = q.isSuggested;

  return (
    <CardShell
      id={`question-${q.id}`}
      variant={isSuggested ? 'suggested' : isSelected ? 'selected' : 'default'}
      dimmed={isDimmed && !isSuggested}
      interactive={!isSuggested}
      connectorLeft={!isSuggested}
      connectorRight={isSelected && !isSuggested}
      onClick={!isSuggested ? () => onSelect(q.id) : undefined}
    >
      <CardHeader
        shortId={q.shortId}
        labels={
          !isSuggested && q.category ? (
            <span className="text-label-upper font-mono text-text-quaternary">{q.category}</span>
          ) : undefined
        }
        actions={
          !isSuggested ? (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetails?.(q.id); }}
              className="p-1 rounded-standard text-text-quaternary hover:text-text-primary hover:bg-surface-frost-08 transition-all"
            >
              <MoreHorizontal size={14} />
            </button>
          ) : undefined
        }
      />

      <CardBody muted={isSuggested}>
        <h3>{q.text}</h3>
      </CardBody>

      {isSuggested ? (
        <div className="flex items-center gap-2">
          <Button onClick={(e) => { e.stopPropagation(); onUseSuggestion(q.id); }}>
            Use
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); onHideSuggestion(q.id); }}>
            Hide
          </Button>
        </div>
      ) : (
        <>
          <Chip
            border="dashed"
            accent={q.status === 'Answered' ? 'success' : q.status === 'Conflicting' ? 'warning' : 'default'}
          >
            <LoaderPinwheel size={12} className={q.status === 'Answered' ? 'text-status-success' : 'text-text-quaternary'} />
            <span className={q.status === 'Answered' ? 'text-status-success' : 'text-text-tertiary'}>{q.status}</span>
          </Chip>

          <CardFooter
            meta={`${q.author || 'Unknown'} - ${formatCardDate(q.createdAt)}`}
            indicators={
              <div
                className={`w-2 h-2 rounded-full ${
                  q.importance === 'Critical' ? 'bg-indicator-high' : q.importance === 'Important' ? 'bg-indicator-medium' : 'bg-indicator-low'
                }`}
                title={q.importance}
              />
            }
          />
        </>
      )}
    </CardShell>
  );
}

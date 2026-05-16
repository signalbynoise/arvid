import React from 'react';
import { LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { Card } from './ui/Card';
import { Chip } from './Chip';
import { Button } from './Button';
import { CardItemMenu } from './CardItemMenu';
import { formatCardDate } from '../lib/formatDate';
import { useStore, selectMembers, selectCardAssignees } from '../store';
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAddUser?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onUseSuggestion: (id: string) => void;
  onHideSuggestion: (id: string) => void;
}

export function QuestionCard({
  question: q,
  isSelected,
  isDimmed,
  onSelect,
  onOpenDetails,
  onEdit,
  onAddUser,
  onDeactivate,
  onUseSuggestion,
  onHideSuggestion,
}: QuestionCardProps) {
  const isSuggested = q.isSuggested;
  const members = useStore(selectMembers);
  const allAssignees = useStore(selectCardAssignees);
  const assignees = allAssignees[`question:${q.id}`] || [];

  const creatorMember = q.createdBy ? members.find(m => m.userId === q.createdBy) : undefined;
  const authorName = creatorMember?.displayName ?? creatorMember?.email?.split('@')[0] ?? q.author ?? 'Unknown';

  return (
    <Card
      id={`question-${q.id}`}
      variant={isSuggested ? 'suggested' : isSelected ? 'selected' : 'default'}
      dimmed={isDimmed && !isSuggested}
      interactive={!isSuggested}
      connectorLeft={!isSuggested}
      connectorRight={isSelected && !isSuggested}
      onClick={!isSuggested ? () => onSelect(q.id) : undefined}
    >
      <Card.Header
        shortId={q.shortId}
        labels={
          !isSuggested && q.category ? (
            <span className="text-label-upper font-mono text-text-quaternary">{q.category}</span>
          ) : undefined
        }
        actions={
          !isSuggested ? (
            <CardItemMenu
              onAddUser={() => onAddUser?.(q.id)}
              onEdit={() => onEdit?.(q.id)}
              onViewDetails={() => onOpenDetails?.(q.id)}
              onDeactivate={() => onDeactivate?.(q.id)}
            />
          ) : undefined
        }
      />

      <Card.Body muted={isSuggested}>
        <h3>{q.text}</h3>
      </Card.Body>

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
            <LoaderPinwheel size={ICON_SIZE.xs} className={q.status === 'Answered' ? 'text-status-success' : 'text-text-quaternary'} />
            <span className={q.status === 'Answered' ? 'text-status-success' : 'text-text-tertiary'}>{q.status}</span>
          </Chip>

          <Card.Footer
            meta={`${q.author || 'Unknown'} - ${formatCardDate(q.createdAt)}`}
            authorName={authorName}
            assigneeCount={assignees.length}
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
    </Card>
  );
}

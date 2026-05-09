import React from 'react';
import { LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { Card } from './ui/Card';
import { Chip } from './Chip';
import { CardItemMenu } from './CardItemMenu';
import { formatCardDate } from '../lib/formatDate';
import { useStore, selectMembers, selectCardAssignees } from '../store';
import type { Answer } from '../types';

interface AnswerCardProps {
  answer: Answer;
  onToggleActive: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAddUser?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

export function AnswerCard({
  answer: ans,
  onToggleActive,
  onOpenDetails,
  onEdit,
  onAddUser,
  onDeactivate,
}: AnswerCardProps) {
  const members = useStore(selectMembers);
  const allAssignees = useStore(selectCardAssignees);
  const assignees = allAssignees[`answer:${ans.id}`] || [];

  const authorName = ans.createdBy
    ? (members.find(m => m.userId === ans.createdBy)?.email?.split('@')[0] || ans.author)
    : ans.author;

  return (
    <Card
      id={`answer-${ans.id}`}
      variant={ans.isCurrent ? 'selected' : 'inactive'}
      connectorLeft
    >
      <Card.Header
        shortId={ans.shortId}
        actions={
          <CardItemMenu
            onAddUser={() => onAddUser?.(ans.id)}
            onEdit={() => onEdit?.(ans.id)}
            onViewDetails={() => onOpenDetails?.(ans.id)}
            onDeactivate={() => onDeactivate?.(ans.id)}
          />
        }
      />

      <Card.Body>
        <p>{ans.text}</p>
      </Card.Body>

      <Chip border="dashed" onClick={(e) => { e.stopPropagation(); onToggleActive(ans.id); }}>
        <LoaderPinwheel size={ICON_SIZE.sm} className={ans.isCurrent ? 'text-text-primary' : 'text-text-quaternary'} />
        <span className={ans.isCurrent ? 'text-text-primary' : 'text-text-tertiary'}>
          {ans.isCurrent ? 'Active Answer' : 'Mark Active'}
        </span>
      </Chip>

      <Card.Footer
        meta={`${ans.author} - ${formatCardDate(ans.date)}`}
        authorName={authorName}
        assigneeCount={assignees.length}
        indicators={<div className="w-2 h-2 rounded-full bg-indicator-high" />}
      />
    </Card>
  );
}

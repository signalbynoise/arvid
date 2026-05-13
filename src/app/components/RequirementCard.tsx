import React from 'react';
import { Card } from './ui/Card';
import { CompletenessChip } from './CompletenessChip';
import { LinearStatusPill } from './LinearStatusPill';
import { GitHubStatusChip } from './GitHubStatusChip';
import { CardItemMenu } from './CardItemMenu';
import { formatCardDate } from '../lib/formatDate';
import { scrollToRequirement } from '../domain/scrollToRequirement';
import { useStore, selectMembers, selectCardAssignees, selectSimilarities } from '../store';
import type { Requirement } from '../types';

interface RequirementCardProps {
  requirement: Requirement;
  completeness: number;
  isSelected: boolean;
  isDimmed: boolean;
  hint?: boolean;
  onClick: () => void;
  onOpenDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onAddUser: (id: string) => void;
  onDeactivate: (id: string) => void;
  onCheckImplementation: (id: string) => void;
  onViewImplDetails: (id: string) => void;
}

export function RequirementCard({
  requirement: req,
  completeness,
  isSelected,
  isDimmed,
  hint = false,
  onClick,
  onOpenDetails,
  onEdit,
  onAddUser,
  onDeactivate,
  onCheckImplementation,
  onViewImplDetails,
}: RequirementCardProps) {
  const members = useStore(selectMembers);
  const allAssignees = useStore(selectCardAssignees);
  const similarities = useStore(selectSimilarities);
  const assignees = allAssignees[`requirement:${req.id}`] || [];
  const similar = similarities[req.id];

  const authorName = req.createdBy
    ? (members.find(m => m.userId === req.createdBy)?.email?.split('@')[0] || req.owner)
    : req.owner;

  return (
    <Card
      id={`req-${req.id}`}
      variant={isSelected ? 'selected' : 'default'}
      dimmed={isDimmed}
      interactive
      connectorRight={isSelected}
      hint={hint}
      onClick={onClick}
    >
      <Card.Header
        shortId={req.shortId}
        actions={
          <CardItemMenu
            onAddUser={() => onAddUser(req.id)}
            onEdit={() => onEdit(req.id)}
            onViewDetails={() => onOpenDetails(req.id)}
            onDeactivate={() => onDeactivate(req.id)}
          />
        }
      />

      <Card.Body>
        <h3>{req.title}</h3>
        {similar && similar.length > 0 && (
          <p className="text-caption-lg text-text-tertiary">
            {'Related to '}
            {similar.map((s, i) => (
              <React.Fragment key={s.id}>
                {i > 0 && ', '}
                <button
                  type="button"
                  className="hover:text-text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToRequirement(s.id);
                  }}
                >
                  {s.shortId ?? s.id.slice(0, 6)}
                </button>
              </React.Fragment>
            ))}
          </p>
        )}
      </Card.Body>

      <div className="flex items-center gap-2 flex-wrap">
        <CompletenessChip value={completeness} />
        <LinearStatusPill status={req.linearStatus} statusType={req.linearStatusType} issueUrl={req.linearIssueUrl} issueIdentifier={req.linearIssueIdentifier} />
        <GitHubStatusChip
          implStatus={req.implStatus ?? 'Not Checked'}
          implConfidence={req.implConfidence}
          implCheckedAt={req.implCheckedAt}
          disabled={req.linearStatusType !== 'completed'}
          onRetry={() => onCheckImplementation(req.id)}
          onViewDetails={() => onViewImplDetails(req.id)}
        />
      </div>

      <Card.Footer
        meta={`${req.owner} - ${formatCardDate(req.createdAt)}`}
        authorName={authorName}
        assigneeCount={assignees.length}
        indicators={
          <>
            <div
              className={`w-2 h-2 rounded-full ${
                req.clarity === 'High' ? 'bg-indicator-high' : req.clarity === 'Medium' ? 'bg-indicator-medium' : 'bg-indicator-low'
              }`}
              title={`Clarity: ${req.clarity}`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                req.risk === 'Low' ? 'bg-indicator-high' : req.risk === 'Medium' ? 'bg-indicator-medium' : 'bg-indicator-low'
              }`}
              title={`Risk: ${req.risk}`}
            />
          </>
        }
      />
    </Card>
  );
}

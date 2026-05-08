import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { CardShell } from './CardShell';
import { CardHeader } from './ui/CardHeader';
import { CardBody } from './ui/CardBody';
import { CardFooter } from './ui/CardFooter';
import { CompletenessChip } from './CompletenessChip';
import { LinearStatusPill } from './LinearStatusPill';
import { GitHubStatusChip } from './GitHubStatusChip';
import { formatCardDate } from '../lib/formatDate';
import type { Requirement } from '../types';

interface RequirementCardProps {
  requirement: Requirement;
  completeness: number;
  isSelected: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onOpenDetails: (id: string) => void;
  onCheckImplementation: (id: string) => void;
  onViewImplDetails: (id: string) => void;
}

export function RequirementCard({
  requirement: req,
  completeness,
  isSelected,
  isDimmed,
  onClick,
  onOpenDetails,
  onCheckImplementation,
  onViewImplDetails,
}: RequirementCardProps) {
  return (
    <CardShell
      id={`req-${req.id}`}
      variant={isSelected ? 'selected' : 'default'}
      dimmed={isDimmed}
      interactive
      connectorRight={isSelected}
      onClick={onClick}
    >
      <CardHeader
        shortId={req.shortId}
        actions={
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetails(req.id); }}
            className="p-1 rounded-standard text-text-quaternary hover:text-text-primary hover:bg-surface-frost-08 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
        }
      />

      <CardBody>
        <h3>{req.title}</h3>
      </CardBody>

      <div className="flex items-center gap-2 flex-wrap">
        <CompletenessChip value={completeness} />
        <LinearStatusPill status={req.linearStatus} statusType={req.linearStatusType} issueUrl={req.linearIssueUrl} issueIdentifier={req.linearIssueIdentifier} />
        <GitHubStatusChip
          implStatus={req.implStatus ?? 'Not Checked'}
          implConfidence={req.implConfidence}
          implCheckedAt={req.implCheckedAt}
          onRetry={() => onCheckImplementation(req.id)}
          onViewDetails={() => onViewImplDetails(req.id)}
        />
      </div>

      <CardFooter
        meta={`${req.owner} - ${formatCardDate(req.createdAt)}`}
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
    </CardShell>
  );
}

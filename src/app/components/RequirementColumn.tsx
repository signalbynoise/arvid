import React, { useMemo, useState } from 'react';
import { Requirement } from '../types';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Chevron } from './Chevron';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { LinearStatusPill } from './LinearStatusPill';
import { GitHubStatusChip } from './GitHubStatusChip';
import { ColumnShell, ColumnBody } from './ColumnShell';
import { CardShell } from './CardShell';
import { CompletenessChip } from './CompletenessChip';
import { formatCardDate } from '../lib/formatDate';
import { useStore, selectRequirements, selectQuestions, selectSelectedReqId } from '../store';

interface Props {
  onNewReqClick?: () => void;
  onOpenDetails?: (id: string) => void;
}

const GROUP_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Source', value: 'source' },
  { label: 'Owner', value: 'owner' },
  { label: 'Risk', value: 'risk' },
  { label: 'Clarity', value: 'clarity' }
];

const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Completeness (Desc)', value: 'completeness_desc' },
  { label: 'Completeness (Asc)', value: 'completeness_asc' },
  { label: 'Risk (High to Low)', value: 'risk_desc' },
  { label: 'Clarity (Low to High)', value: 'clarity_asc' }
];

const riskScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
const clarityScore = { 'High': 3, 'Medium': 2, 'Low': 1 };

function computeLocalCompleteness(reqId: string, allQuestions: { requirementId: string; status: string; importance: string }[]): number {
  const questions = allQuestions.filter(q => q.requirementId === reqId);
  const totalWeight = questions.reduce((acc, q) => acc + (q.importance === 'Critical' ? 3 : q.importance === 'Important' ? 2 : 1), 0);
  const answeredWeight = questions.filter(q => q.status === 'Answered').reduce((acc, q) => acc + (q.importance === 'Critical' ? 3 : q.importance === 'Important' ? 2 : 1), 0);
  return totalWeight > 0 ? Math.round((answeredWeight / totalWeight) * 100) : 0;
}

function effectiveCompleteness(req: { id: string; completeness: number }, allQuestions: { requirementId: string; status: string; importance: string }[]): number {
  return req.completeness > 0 ? req.completeness : computeLocalCompleteness(req.id, allQuestions);
}

export function RequirementColumn({ onNewReqClick, onOpenDetails }: Props) {
  const requirements = useStore(selectRequirements);
  const allQuestions = useStore(selectQuestions);
  const selectedId = useStore(selectSelectedReqId);
  const selectRequirement = useStore(s => s.selectRequirement);
  const checkImplementation = useStore(s => s.checkImplementation);

  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('default');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: prev[group] === false ? true : false }));
  };

  const processedRequirements = useMemo(() => {
    let sorted = [...requirements];
    if (sortBy === 'completeness_desc') sorted.sort((a, b) => effectiveCompleteness(b, allQuestions) - effectiveCompleteness(a, allQuestions));
    else if (sortBy === 'completeness_asc') sorted.sort((a, b) => effectiveCompleteness(a, allQuestions) - effectiveCompleteness(b, allQuestions));
    else if (sortBy === 'risk_desc') sorted.sort((a, b) => (riskScore[b.risk as keyof typeof riskScore] || 0) - (riskScore[a.risk as keyof typeof riskScore] || 0));
    else if (sortBy === 'clarity_asc') sorted.sort((a, b) => (clarityScore[a.clarity as keyof typeof clarityScore] || 0) - (clarityScore[b.clarity as keyof typeof clarityScore] || 0));

    if (groupBy === 'none') return { 'All': sorted };

    const grouped: Record<string, Requirement[]> = {};
    sorted.forEach(req => {
      let key = 'Other';
      if (groupBy === 'source') key = req.source || 'Other';
      else if (groupBy === 'owner') key = req.owner || 'Unassigned';
      else if (groupBy === 'risk') key = req.risk || 'None';
      else if (groupBy === 'clarity') key = req.clarity || 'None';
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(req);
    });
    return grouped;
  }, [requirements, allQuestions, groupBy, sortBy]);

  const renderRequirement = (req: Requirement) => {
    const isSelected = req.id === selectedId;
    const isDimmed = selectedId !== null && !isSelected;
    const liveCompleteness = effectiveCompleteness(req, allQuestions);
    
    return (
      <CardShell
        key={req.id}
        id={`req-${req.id}`}
        variant={isSelected ? 'selected' : 'default'}
        dimmed={isDimmed}
        interactive
        connectorRight={isSelected}
        onClick={() => selectRequirement(req.id)}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            {req.shortId && (
              <span className="text-tiny font-mono text-text-quaternary">{req.shortId}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.(req.id);
              }}
              className="p-1 rounded-standard text-text-quaternary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-frost-08 transition-all"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
          <h3 className="text-text-primary">{req.title}</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CompletenessChip value={liveCompleteness} />
          <LinearStatusPill status={req.linearStatus} statusType={req.linearStatusType} issueUrl={req.linearIssueUrl} issueIdentifier={req.linearIssueIdentifier} />
          <GitHubStatusChip
            implStatus={req.implStatus ?? 'Not Checked'}
            implConfidence={req.implConfidence}
            implCheckedAt={req.implCheckedAt}
            onRetry={() => checkImplementation(req.id)}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-label text-text-quaternary">
            {req.owner} - {formatCardDate(req.createdAt)}
          </p>
          <div className="flex items-center gap-1.5">
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
          </div>
        </div>
      </CardShell>
    );
  };

  return (
    <ColumnShell
      title="1. Requirements"
      headerControls={
        <>
          <SortGroupControls 
            groupByOptions={GROUP_OPTIONS}
            sortByOptions={SORT_OPTIONS}
            currentGroup={groupBy}
            currentSort={sortBy}
            onGroupChange={setGroupBy}
            onSortChange={setSortBy}
          />
          <IconButton title="New Requirement" onClick={onNewReqClick}>
            <Plus size={14} />
          </IconButton>
        </>
      }
    >
      <ColumnBody>
        {Object.entries(processedRequirements).map(([group, reqs]) => {
          if (groupBy === 'none') {
            return <div key="all" className="space-y-3">{reqs.map(renderRequirement)}</div>;
          }
          
          const isExpanded = expandedGroups[group] !== false;
          return (
            <div key={group} className="flex flex-col space-y-2">
              <button 
                onClick={() => toggleGroup(group)}
                className="flex items-center text-[11px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors"
              >
                <Chevron open={isExpanded} />
                <span className="uppercase tracking-wider">{group}</span>
                <span className="ml-2 text-text-quaternary bg-surface-frost-05 px-1.5 py-0.5 rounded-standard">{reqs.length}</span>
              </button>
              
              {isExpanded && (
                <div className="space-y-3 pt-1">
                  {reqs.map(renderRequirement)}
                </div>
              )}
            </div>
          );
        })}
      </ColumnBody>
    </ColumnShell>
  );
}

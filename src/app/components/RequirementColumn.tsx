import React, { useMemo, useState } from 'react';
import { Requirement } from '../types';
import { Plus } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { RequirementCard } from './RequirementCard';
import { GroupHeader } from './GroupHeader';
import { ImplDetailsModal } from './ImplDetailsModal';
import { ColumnShell, ColumnBody } from './ColumnShell';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, selectRequirements, selectQuestions, selectSelectedReqId, selectHintRequirementCards } from '../store';
import { buildProjectPath, buildRequirementPath } from '../domain/paths';
import { effectiveCompleteness } from '../domain/completeness';
import { RISK_SCORE, CLARITY_SCORE, scoreFor } from '../domain/sorting';

interface Props {
  onNewReqClick?: () => void;
  onOpenDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAddUser?: (entityType: 'requirement' | 'question' | 'answer', entityId: string) => void;
  onDeactivate?: (entityType: 'requirement' | 'question' | 'answer', entityId: string) => void;
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

export function RequirementColumn({ onNewReqClick, onOpenDetails, onEdit, onAddUser, onDeactivate }: Props) {
  const navigate = useNavigate();
  const { wsShortId, teamShortId, projectShortId } = useParams();
  const requirements = useStore(selectRequirements);
  const allQuestions = useStore(selectQuestions);
  const selectedId = useStore(selectSelectedReqId);
  const checkImplementation = useStore(s => s.checkImplementation);
  const checkingImplementation = useStore(s => s.checkingImplementation);
  const checkDeployStatus = useStore(s => s.checkDeployStatus);
  const renderConnected = useStore(s => s.renderConnection.status === 'connected');
  const hintCards = useStore(selectHintRequirementCards);

  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('default');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [implDetailReqId, setImplDetailReqId] = useState<string | null>(null);

  const processedRequirements = useMemo(() => {
    let sorted = [...requirements];
    if (sortBy === 'completeness_desc') sorted.sort((a, b) => effectiveCompleteness(b, allQuestions) - effectiveCompleteness(a, allQuestions));
    else if (sortBy === 'completeness_asc') sorted.sort((a, b) => effectiveCompleteness(a, allQuestions) - effectiveCompleteness(b, allQuestions));
    else if (sortBy === 'risk_desc') sorted.sort((a, b) => scoreFor(RISK_SCORE, b.risk) - scoreFor(RISK_SCORE, a.risk));
    else if (sortBy === 'clarity_asc') sorted.sort((a, b) => scoreFor(CLARITY_SCORE, a.clarity) - scoreFor(CLARITY_SCORE, b.clarity));

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

  const handleClick = (req: Requirement) => {
    if (wsShortId && teamShortId && projectShortId && req.shortId) {
      if (req.id === selectedId) {
        navigate(buildProjectPath(wsShortId, teamShortId, projectShortId));
      } else {
        navigate(buildRequirementPath(wsShortId, teamShortId, projectShortId, req.shortId));
      }
    }
  };

  const renderCards = (reqs: Requirement[]) =>
    reqs.map(req => (
      <RequirementCard
        key={req.id}
        requirement={req}
        completeness={effectiveCompleteness(req, allQuestions)}
        isSelected={req.id === selectedId}
        isDimmed={selectedId !== null && req.id !== selectedId}
        hint={hintCards}
        onClick={() => handleClick(req)}
        onOpenDetails={onOpenDetails ?? (() => {})}
        onEdit={onEdit ?? (() => {})}
        onAddUser={onAddUser ? (id) => onAddUser('requirement', id) : () => {}}
        onDeactivate={onDeactivate ? (id) => onDeactivate('requirement', id) : () => {}}
        onCheckImplementation={checkImplementation}
        onCheckDeploy={checkDeployStatus}
        renderConnected={renderConnected}
        onViewImplDetails={(id) => setImplDetailReqId(id)}
      />
    ));

  return (
    <ColumnShell
      title="Requirements"
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
            <Plus size={ICON_SIZE.sm} />
          </IconButton>
        </>
      }
    >
      <ColumnBody>
        {Object.entries(processedRequirements).map(([group, reqs]) => {
          if (groupBy === 'none') {
            return <div key="all" className="space-y-3">{renderCards(reqs)}</div>;
          }

          const isExpanded = expandedGroups[group] !== false;
          return (
            <div key={group} className="flex flex-col space-y-2">
              <GroupHeader
                label={group}
                count={reqs.length}
                isExpanded={isExpanded}
                onToggle={() => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] !== false ? true : false }))}
              />
              {isExpanded && <div className="space-y-3 pt-1">{renderCards(reqs)}</div>}
            </div>
          );
        })}
      </ColumnBody>

      <ImplDetailsModal
        isOpen={implDetailReqId !== null}
        onClose={() => setImplDetailReqId(null)}
        requirement={requirements.find(r => r.id === implDetailReqId) ?? null}
        isChecking={implDetailReqId !== null && checkingImplementation.has(implDetailReqId)}
        onRecheck={checkImplementation}
      />
    </ColumnShell>
  );
}

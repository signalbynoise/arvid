import React, { useMemo, useState, useEffect } from 'react';
import { Question } from '../types';
import { Plus, MessageCircleQuestion, LoaderPinwheel } from 'lucide-react';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { QuestionCard } from './QuestionCard';
import { GroupHeader } from './GroupHeader';
import { NewQuestionModal } from './NewQuestionModal';
import { ColumnShell, ColumnBody, ColumnEmptyState } from './ColumnShell';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, selectQuestions, selectSelectedReqId, selectSelectedQuestionId, selectIsSuggestingQuestions, selectPendingModal, selectRequirements } from '../store';
import { buildRequirementPath, buildQuestionPath } from '../domain/paths';
import { IMPORTANCE_SCORE, STATUS_SCORE, scoreFor } from '../domain/sorting';
import { useAutoSuggestQuestions } from '../hooks/useAutoSuggestQuestions';

interface Props {
  onOpenDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAddUser?: (entityType: 'requirement' | 'question' | 'answer', entityId: string) => void;
  onDeactivate?: (entityType: 'requirement' | 'question' | 'answer', entityId: string) => void;
}

const GROUP_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Category', value: 'category' },
  { label: 'Importance', value: 'importance' },
  { label: 'Status', value: 'status' },
  { label: 'Type', value: 'type' }
];

const SORT_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Importance (Critical first)', value: 'importance_desc' },
  { label: 'Status (Action needed)', value: 'status_action' }
];

export function QuestionColumn({ onOpenDetails, onEdit, onAddUser, onDeactivate }: Props) {
  const navigate = useNavigate();
  const { wsShortId, teamShortId, projectShortId, reqShortId } = useParams();
  const allQuestions = useStore(selectQuestions);
  const requirements = useStore(selectRequirements);
  const selectedReqId = useStore(selectSelectedReqId);
  const selectedId = useStore(selectSelectedQuestionId);
  const isSuggestingQuestions = useStore(selectIsSuggestingQuestions);
  const useSuggestion = useStore(s => s.useSuggestion);
  const hideSuggestion = useStore(s => s.hideSuggestion);

  useAutoSuggestQuestions();

  const questions = useMemo(
    () => allQuestions.filter(q => q.requirementId === selectedReqId),
    [allQuestions, selectedReqId],
  );

  const navigateToQuestion = (questionId: string) => {
    const question = allQuestions.find(q => q.id === questionId);
    const currentReqShortId = reqShortId ?? requirements.find(r => r.id === selectedReqId)?.shortId;
    if (wsShortId && teamShortId && projectShortId && currentReqShortId && question?.shortId) {
      if (selectedId === questionId) {
        navigate(buildRequirementPath(wsShortId, teamShortId, projectShortId, currentReqShortId));
      } else {
        navigate(buildQuestionPath(wsShortId, teamShortId, projectShortId, currentReqShortId, question.shortId));
      }
    }
  };

  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('default');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const pendingModal = useStore(selectPendingModal);
  const clearPendingModal = useStore(s => s.clearPendingModal);

  useEffect(() => {
    if (pendingModal?.type === 'createQuestion') {
      setIsNewQuestionOpen(true);
      clearPendingModal();
    }
  }, [pendingModal, clearPendingModal]);

  const processedQuestions = useMemo(() => {
    let sorted = questions.filter(q => !q.isHidden);
    if (sortBy === 'importance_desc') {
      sorted.sort((a, b) => scoreFor(IMPORTANCE_SCORE, b.importance) - scoreFor(IMPORTANCE_SCORE, a.importance));
    } else if (sortBy === 'status_action') {
      sorted.sort((a, b) => scoreFor(STATUS_SCORE, b.status) - scoreFor(STATUS_SCORE, a.status));
    }

    if (groupBy === 'none') return { 'All': sorted };

    const grouped: Record<string, Question[]> = {};
    sorted.forEach(q => {
      let key = 'Other';
      if (groupBy === 'category') key = q.category || 'Other';
      else if (groupBy === 'importance') key = q.importance || 'None';
      else if (groupBy === 'status') key = q.status || 'None';
      else if (groupBy === 'type') key = q.type || 'Other';

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    });
    return grouped;
  }, [questions, groupBy, sortBy]);

  const headerControls = (
    <div className="flex items-center">
      {isSuggestingQuestions && (
        <LoaderPinwheel size={14} className="text-text-tertiary animate-spin mr-2" />
      )}
      <SortGroupControls
        groupByOptions={GROUP_OPTIONS}
        sortByOptions={SORT_OPTIONS}
        currentGroup={groupBy}
        currentSort={sortBy}
        onGroupChange={setGroupBy}
        onSortChange={setSortBy}
      />
      <IconButton title="New Question" onClick={() => setIsNewQuestionOpen(true)}>
        <Plus size={14} />
      </IconButton>
    </div>
  );

  const renderCards = (qs: Question[]) =>
    qs.map(q => (
      <QuestionCard
        key={q.id}
        question={q}
        isSelected={q.id === selectedId}
        isDimmed={selectedId !== null && q.id !== selectedId}
        onSelect={navigateToQuestion}
        onOpenDetails={onOpenDetails}
        onEdit={onEdit}
        onAddUser={onAddUser ? (id) => onAddUser('question', id) : undefined}
        onDeactivate={onDeactivate ? (id) => onDeactivate('question', id) : undefined}
        onUseSuggestion={useSuggestion}
        onHideSuggestion={hideSuggestion}
      />
    ));

  if (questions.length === 0) {
    return (
      <ColumnShell title="Questions" headerControls={headerControls}>
        <ColumnEmptyState
          icon={isSuggestingQuestions
            ? <LoaderPinwheel size={32} className="mb-3 opacity-20" />
            : <MessageCircleQuestion size={32} className="mb-3 opacity-20" />
          }
          message={isSuggestingQuestions ? "Arvid is analyzing the requirement..." : "No questions yet. Add one to start the flow."}
        />
        <NewQuestionModal isOpen={isNewQuestionOpen} onClose={() => setIsNewQuestionOpen(false)} />
      </ColumnShell>
    );
  }

  return (
    <ColumnShell title="Questions" headerControls={headerControls}>
      <ColumnBody>
        {Object.entries(processedQuestions).map(([group, qs]) => {
          if (groupBy === 'none') {
            return <div key="all" className="space-y-3">{renderCards(qs)}</div>;
          }

          const isExpanded = expandedGroups[group] !== false;
          return (
            <div key={group} className="flex flex-col space-y-2">
              <GroupHeader
                label={group}
                count={qs.length}
                isExpanded={isExpanded}
                onToggle={() => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] !== false ? true : false }))}
              />
              {isExpanded && <div className="space-y-3 pt-1">{renderCards(qs)}</div>}
            </div>
          );
        })}
      </ColumnBody>
      <NewQuestionModal isOpen={isNewQuestionOpen} onClose={() => setIsNewQuestionOpen(false)} />
    </ColumnShell>
  );
}

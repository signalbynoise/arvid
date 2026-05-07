import React, { useMemo, useState, useEffect } from 'react';
import { Question } from '../types';
import { Plus, MessageCircleQuestion, MoreHorizontal, LoaderPinwheel } from 'lucide-react';
import { Chevron } from './Chevron';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { NewQuestionModal } from './NewQuestionModal';
import { ColumnShell, ColumnBody, ColumnEmptyState } from './ColumnShell';
import { CardShell } from './CardShell';
import { Chip } from './Chip';
import { Button } from './Button';
import { formatCardDate } from '../lib/formatDate';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, selectQuestions, selectSelectedReqId, selectSelectedQuestionId, selectIsSuggestingQuestions, selectPendingModal, selectRequirements } from '../store';
import { buildQuestionPath } from '../domain/paths';

interface Props {
  onOpenDetails?: (id: string) => void;
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

const importanceScore = { 'Critical': 3, 'Important': 2, 'Optional': 1 };
const statusScore = { 'Unanswered': 3, 'Conflicting': 2, 'Answered': 1 };

interface QuestionCardProps {
  q: Question;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  onUseSuggestion: (id: string) => void;
  onHideSuggestion: (id: string) => void;
}

function QuestionCard({ q, isSelected, isDimmed, onSelect, onOpenDetails, onUseSuggestion, onHideSuggestion }: QuestionCardProps) {
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {q.shortId && (
              <span className="text-tiny font-mono text-text-quaternary">{q.shortId}</span>
            )}
            {!isSuggested && q.category && (
              <span className="text-tiny font-mono text-text-quaternary uppercase">{q.category}</span>
            )}
          </div>
          {!isSuggested && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.(q.id);
              }}
              className="p-1 rounded-standard text-text-quaternary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-frost-08 transition-all"
            >
              <MoreHorizontal size={14} />
            </button>
          )}
        </div>
        <h3 className={isSuggested ? 'text-text-quaternary' : 'text-text-primary'}>{q.text}</h3>
      </div>

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

          <div className="flex items-center justify-between">
            <p className="text-label text-text-quaternary">
              {q.author || 'Unknown'} - {formatCardDate(q.createdAt)}
            </p>
            <div 
              className={`w-2 h-2 rounded-full ${
                q.importance === 'Critical' ? 'bg-indicator-high' : q.importance === 'Important' ? 'bg-indicator-medium' : 'bg-indicator-low'
              }`}
              title={q.importance}
            />
          </div>
        </>
      )}
    </CardShell>
  );
}

export function QuestionColumn({ onOpenDetails }: Props) {
  const navigate = useNavigate();
  const { wsShortId, teamShortId, projectShortId, reqShortId } = useParams();
  const allQuestions = useStore(selectQuestions);
  const requirements = useStore(selectRequirements);
  const selectedReqId = useStore(selectSelectedReqId);
  const selectedId = useStore(selectSelectedQuestionId);
  const isSuggestingQuestions = useStore(selectIsSuggestingQuestions);

  const questions = useMemo(
    () => allQuestions.filter(q => q.requirementId === selectedReqId),
    [allQuestions, selectedReqId],
  );

  const navigateToQuestion = (questionId: string) => {
    const question = allQuestions.find(q => q.id === questionId);
    const currentReqShortId = reqShortId ?? requirements.find(r => r.id === selectedReqId)?.shortId;
    if (wsShortId && teamShortId && projectShortId && currentReqShortId && question?.shortId) {
      navigate(buildQuestionPath(wsShortId, teamShortId, projectShortId, currentReqShortId, question.shortId));
    }
  };
  const useSuggestion = useStore(s => s.useSuggestion);
  const hideSuggestion = useStore(s => s.hideSuggestion);
  const suggestQuestions = useStore(s => s.suggestQuestions);

  useEffect(() => {
    if (selectedReqId && questions.length === 0 && !isSuggestingQuestions) {
      suggestQuestions(selectedReqId);
    }
  }, [selectedReqId, questions.length, isSuggestingQuestions, suggestQuestions]);

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

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: prev[group] === false ? true : false }));
  };

  const processedQuestions = useMemo(() => {
    let sorted = questions.filter(q => !q.isHidden);
    if (sortBy === 'importance_desc') {
      sorted.sort((a, b) => (importanceScore[b.importance as keyof typeof importanceScore] || 0) - (importanceScore[a.importance as keyof typeof importanceScore] || 0));
    } else if (sortBy === 'status_action') {
      sorted.sort((a, b) => (statusScore[b.status as keyof typeof statusScore] || 0) - (statusScore[a.status as keyof typeof statusScore] || 0));
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

  const renderQuestion = (q: Question) => (
    <QuestionCard
      key={q.id}
      q={q}
      isSelected={q.id === selectedId}
      isDimmed={selectedId !== null && q.id !== selectedId}
      onSelect={navigateToQuestion}
      onOpenDetails={onOpenDetails}
      onUseSuggestion={useSuggestion}
      onHideSuggestion={hideSuggestion}
    />
  );

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

  if (questions.length === 0) {
    return (
      <ColumnShell title="2. Questions" headerControls={headerControls}>
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
    <ColumnShell title="2. Questions" headerControls={headerControls}>
      <ColumnBody>
        {Object.entries(processedQuestions).map(([group, qs]) => {
          if (groupBy === 'none') {
            return <div key="all" className="space-y-3">{qs.map(renderQuestion)}</div>;
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
                <span className="ml-2 text-text-quaternary bg-surface-frost-05 px-1.5 py-0.5 rounded-standard">{qs.length}</span>
              </button>
              
              {isExpanded && (
                <div className="space-y-3 pt-1">
                  {qs.map(renderQuestion)}
                </div>
              )}
            </div>
          );
        })}
      </ColumnBody>
      <NewQuestionModal isOpen={isNewQuestionOpen} onClose={() => setIsNewQuestionOpen(false)} />
    </ColumnShell>
  );
}

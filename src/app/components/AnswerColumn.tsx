import React, { useMemo, useState, useEffect } from 'react';
import { Answer } from '../types';
import { Plus, MessageSquare, MoreHorizontal, LoaderPinwheel } from 'lucide-react';
import { Chevron } from './Chevron';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { NewAnswerModal } from './NewAnswerModal';
import { SuggestedAnswerCard } from './SuggestedAnswerCard';
import { ColumnShell, ColumnBody, ColumnEmptyState } from './ColumnShell';
import { CardShell } from './CardShell';
import { Chip } from './Chip';
import { formatCardDate } from '../lib/formatDate';
import { useStore, selectAnswers, selectSelectedQuestionId, selectIsSuggestingAnswer, selectIsAnswerSuggestionSkipped, selectPendingModal } from '../store';

const GROUP_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Author', value: 'author' },
  { label: 'Status (Active)', value: 'status' }
];

const SORT_OPTIONS = [
  { label: 'Date (Newest)', value: 'date_desc' },
  { label: 'Date (Oldest)', value: 'date_asc' },
  { label: 'Status (Active First)', value: 'status_active' }
];

function AnswerCard({ ans, onToggleActive }: { ans: Answer; onToggleActive: (id: string) => void }) {
  return (
    <CardShell
      id={`answer-${ans.id}`}
      variant={ans.isCurrent ? 'selected' : 'inactive'}
      connectorLeft
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {ans.shortId && (
            <span className="text-tiny font-mono text-text-quaternary">{ans.shortId}</span>
          )}
          <button
            className="p-1 rounded-standard text-text-quaternary hover:text-text-primary hover:bg-surface-frost-08 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
        <p className="text-text-primary">{ans.text}</p>
      </div>

      <Chip border="dashed" onClick={(e) => { e.stopPropagation(); onToggleActive(ans.id); }}>
        <LoaderPinwheel size={14} className={ans.isCurrent ? 'text-text-primary' : 'text-text-quaternary'} />
        <span className={ans.isCurrent ? 'text-text-primary' : 'text-text-tertiary'}>
          {ans.isCurrent ? 'Active Answer' : 'Mark Active'}
        </span>
      </Chip>

      <div className="flex items-center justify-between">
        <p className="text-label text-text-quaternary">{ans.author} - {formatCardDate(ans.date)}</p>
        <div className="w-2 h-2 rounded-full bg-indicator-high" />
      </div>
    </CardShell>
  );
}

export function AnswerColumn() {
  const allAnswers = useStore(selectAnswers);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const isSuggestingAnswer = useStore(selectIsSuggestingAnswer);
  const isAnswerSkipped = useStore(selectIsAnswerSuggestionSkipped);
  const questionSelected = selectedQuestionId !== null;

  const allForQuestion = useMemo(
    () => allAnswers.filter(a => a.questionId === selectedQuestionId),
    [allAnswers, selectedQuestionId],
  );

  const answers = useMemo(
    () => allForQuestion.filter(a => !a.isSuggested && !a.isHidden),
    [allForQuestion],
  );

  const suggestedAnswers = useMemo(
    () => allForQuestion.filter(a => a.isSuggested && !a.isHidden),
    [allForQuestion],
  );

  const toggleCurrentAnswer = useStore(s => s.toggleCurrentAnswer);

  const useSuggestedAnswer = useStore(s => s.useSuggestedAnswer);
  const hideSuggestedAnswer = useStore(s => s.hideSuggestedAnswer);
  const suggestAnswer = useStore(s => s.suggestAnswer);

  useEffect(() => {
    if (selectedQuestionId && allForQuestion.length === 0 && !isSuggestingAnswer && !isAnswerSkipped) {
      suggestAnswer(selectedQuestionId);
    }
  }, [selectedQuestionId, allForQuestion.length, isSuggestingAnswer, isAnswerSkipped, suggestAnswer]);

  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('date_desc');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isNewAnswerOpen, setIsNewAnswerOpen] = useState(false);
  const pendingModal = useStore(selectPendingModal);
  const clearPendingModal = useStore(s => s.clearPendingModal);

  useEffect(() => {
    if (pendingModal?.type === 'createAnswer') {
      setIsNewAnswerOpen(true);
      clearPendingModal();
    }
  }, [pendingModal, clearPendingModal]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: prev[group] === false ? true : false }));
  };

  const processedAnswers = useMemo(() => {
    let sorted = [...answers];
    if (sortBy === 'date_desc') {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === 'date_asc') {
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === 'status_active') {
      sorted.sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
    }

    if (groupBy === 'none') return { 'All': sorted };

    const grouped: Record<string, Answer[]> = {};
    sorted.forEach(ans => {
      let key = 'Other';
      if (groupBy === 'author') key = ans.author || 'Unknown';
      else if (groupBy === 'status') key = ans.isCurrent ? 'Active Answers' : 'Historical Answers';
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ans);
    });
    return grouped;
  }, [answers, groupBy, sortBy]);

  const renderAnswer = (ans: Answer) => (
    <AnswerCard key={ans.id} ans={ans} onToggleActive={toggleCurrentAnswer} />
  );

  if (!questionSelected) {
    return (
      <ColumnShell title="3. Answers">
        <ColumnEmptyState
          icon={<MessageSquare size={32} className="mb-3 opacity-20" />}
          message="Select a question to view or add answers."
        />
      </ColumnShell>
    );
  }

  return (
    <ColumnShell
      title="3. Answers"
      headerControls={
        <>
          {isSuggestingAnswer && (
            <LoaderPinwheel size={14} className="text-text-tertiary animate-spin mr-2" />
          )}
          {answers.length > 0 && (
            <SortGroupControls 
              groupByOptions={GROUP_OPTIONS}
              sortByOptions={SORT_OPTIONS}
              currentGroup={groupBy}
              currentSort={sortBy}
              onGroupChange={setGroupBy}
              onSortChange={setSortBy}
            />
          )}
          <IconButton title="New Answer" onClick={() => setIsNewAnswerOpen(true)}>
            <Plus size={14} />
          </IconButton>
        </>
      }
    >
      <ColumnBody>
        {suggestedAnswers.map(sa => (
          <SuggestedAnswerCard
            key={sa.id}
            answer={sa}
            onUse={useSuggestedAnswer}
            onHide={hideSuggestedAnswer}
          />
        ))}

        {answers.length === 0 && suggestedAnswers.length === 0 ? (
          !isSuggestingAnswer && (
            <ColumnEmptyState
              icon={<MessageSquare size={32} className="mb-3 opacity-20" />}
              message="No answers yet. Add one to clarify this question."
            />
          )
        ) : (
          Object.entries(processedAnswers).map(([group, ans]) => {
            if (groupBy === 'none') {
              return <div key="all" className="space-y-3">{ans.map(renderAnswer)}</div>;
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
                  <span className="ml-2 text-text-quaternary bg-surface-frost-05 px-1.5 py-0.5 rounded-standard">{ans.length}</span>
                </button>
                
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    {ans.map(renderAnswer)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </ColumnBody>
      <NewAnswerModal isOpen={isNewAnswerOpen} onClose={() => setIsNewAnswerOpen(false)} />
    </ColumnShell>
  );
}

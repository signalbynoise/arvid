import React, { useMemo, useState, useEffect } from 'react';
import { Answer } from '../types';
import { Plus, MessageSquare, LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { AnswerCard } from './AnswerCard';
import { GroupHeader } from './GroupHeader';
import { NewAnswerModal } from './NewAnswerModal';
import { SuggestedAnswerCard } from './SuggestedAnswerCard';
import { ColumnShell, ColumnBody, ColumnEmptyState } from './ColumnShell';
import { useStore, selectAnswers, selectSelectedQuestionId, selectIsSuggestingAnswer, selectPendingModal } from '../store';
import { useAutoSuggestAnswer } from '../hooks/useAutoSuggestAnswer';

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

interface Props {
  onOpenDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAddUser?: (entityType: 'requirement' | 'question' | 'answer', entityId: string) => void;
  onDeactivate?: (entityType: 'requirement' | 'question' | 'answer', entityId: string) => void;
}

export function AnswerColumn({ onOpenDetails, onEdit, onAddUser, onDeactivate }: Props) {
  const allAnswers = useStore(selectAnswers);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const isSuggestingAnswer = useStore(selectIsSuggestingAnswer);
  const questionSelected = selectedQuestionId !== null;

  useAutoSuggestAnswer();

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

  const renderCards = (items: Answer[]) =>
    items.map(a => (
      <AnswerCard
        key={a.id}
        answer={a}
        onToggleActive={toggleCurrentAnswer}
        onOpenDetails={onOpenDetails}
        onEdit={onEdit}
        onAddUser={onAddUser ? (id) => onAddUser('answer', id) : undefined}
        onDeactivate={onDeactivate ? (id) => onDeactivate('answer', id) : undefined}
      />
    ));

  if (!questionSelected) {
    return (
      <ColumnShell title="Answers">
        <ColumnEmptyState
          icon={<MessageSquare size={ICON_SIZE['2xl']} className="mb-3 opacity-20" />}
          message="Select a question to view or add answers."
        />
      </ColumnShell>
    );
  }

  return (
    <ColumnShell
      title="Answers"
      headerControls={
        <>
          {isSuggestingAnswer && (
            <LoaderPinwheel size={ICON_SIZE.sm} className="text-text-tertiary animate-spin mr-2" />
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
            <Plus size={ICON_SIZE.sm} />
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
              icon={<MessageSquare size={ICON_SIZE['2xl']} className="mb-3 opacity-20" />}
              message="No answers yet. Add one to clarify this question."
            />
          )
        ) : (
          Object.entries(processedAnswers).map(([group, items]) => {
            if (groupBy === 'none') {
              return <div key="all" className="space-y-3">{renderCards(items)}</div>;
            }

            const isExpanded = expandedGroups[group] !== false;
            return (
              <div key={group} className="flex flex-col space-y-2">
                <GroupHeader
                  label={group}
                  count={items.length}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] !== false ? true : false }))}
                />
                {isExpanded && <div className="space-y-3 pt-1">{renderCards(items)}</div>}
              </div>
            );
          })
        )}
      </ColumnBody>
      <NewAnswerModal isOpen={isNewAnswerOpen} onClose={() => setIsNewAnswerOpen(false)} />
    </ColumnShell>
  );
}

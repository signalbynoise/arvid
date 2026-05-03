import React, { useMemo, useState } from 'react';
import { Question } from '../types';
import { Plus, MessageCircleQuestion, AlertCircle, CheckCircle2, CircleDashed, ChevronDown, ChevronRight, Check, X, Eye, User, LoaderPinwheel } from 'lucide-react';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { NewQuestionModal } from './NewQuestionModal';
import { useStore, selectQuestions, selectSelectedReqId, selectSelectedQuestionId, selectIsSuggestingQuestions } from '../store';

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

export function QuestionColumn({ onOpenDetails }: Props) {
  const allQuestions = useStore(selectQuestions);
  const selectedReqId = useStore(selectSelectedReqId);
  const selectedId = useStore(selectSelectedQuestionId);
  const isSuggestingQuestions = useStore(selectIsSuggestingQuestions);

  const questions = useMemo(
    () => allQuestions.filter(q => q.requirementId === selectedReqId),
    [allQuestions, selectedReqId],
  );
  const selectQuestion = useStore(s => s.selectQuestion);
  const useSuggestion = useStore(s => s.useSuggestion);
  const hideSuggestion = useStore(s => s.hideSuggestion);

  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('default');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: prev[group] === false ? true : false }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Answered': return <CheckCircle2 size={12} className="text-status-success" />;
      case 'Conflicting': return <AlertCircle size={12} className="text-status-warning" />;
      case 'Unanswered': return <CircleDashed size={12} className="text-status-error" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Answered': return 'text-status-success bg-status-success-surface border-status-success-border';
      case 'Conflicting': return 'text-status-warning bg-status-warning-surface border-status-warning-border';
      case 'Unanswered': return 'text-status-error bg-status-error-surface border-status-error-border';
      default: return 'text-text-tertiary bg-surface-frost-05 border-border-subtle';
    }
  };

  const getImportanceClass = (importance: string) => {
    switch (importance) {
      case 'Critical': return 'bg-status-error';
      case 'Important': return 'bg-status-warning';
      case 'Optional': return 'bg-text-tertiary';
      default: return 'bg-text-tertiary';
    }
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

  const renderQuestion = (q: Question) => {
    const isSelected = q.id === selectedId;
    const isDimmed = selectedId !== null && !isSelected;
    const isSuggested = q.isSuggested;
    
    return (
      <div
        id={`question-${q.id}`}
        key={q.id}
        onClick={() => !isSuggested && selectQuestion(q.id)}
        className={`group relative z-[1] p-4 rounded-card transition-all duration-200 ease-in-out ${
          isSuggested 
            ? 'border border-dashed border-border-strong bg-surface-frost-01 opacity-70 hover:opacity-100'
            : isSelected 
              ? 'border border-border-focus bg-surface-frost-05 shadow-card-selected cursor-pointer' 
              : 'border border-border-default bg-surface-frost-02 hover:bg-surface-frost-04 hover:border-border-hover cursor-pointer'
        } ${isDimmed && !isSuggested ? 'opacity-30 saturate-50 hover:opacity-100 hover:saturate-100' : ''}`}
      >
        {isSelected && !isSuggested && (
          <div className="absolute top-1/2 -right-4 w-4 h-[1px] bg-border-focus" />
        )}
        {!isSuggested && (
          <div className="absolute top-1/2 -left-4 w-4 h-[1px] bg-border-focus" />
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails?.(q.id);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-standard text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-primary hover:bg-surface-frost-08 transition-all"
        >
          <Eye size={14} />
        </button>

        {isSuggested && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1.5 py-0.5 rounded-standard uppercase tracking-wider border border-border-subtle">AI Suggestion</span>
            </div>
          </div>
        )}
        
        <h3 className={`font-[var(--fw-regular)] text-[14px] mb-4 pr-4 leading-snug ${isSuggested ? 'text-text-tertiary' : 'text-text-primary'}`}>{q.text}</h3>
        
        <div className="flex items-center text-[12px] text-text-tertiary mb-3 space-x-2">
          <div className="flex items-center space-x-1.5">
            {(isSuggested || q.author === 'System AI' || q.author === 'Arvid' || q.authorTeam === 'Arvid') ? (
              <LoaderPinwheel size={13} className="opacity-70" />
            ) : (
              <User size={13} className="opacity-70" />
            )}
            <span className="truncate max-w-[120px]" title={(isSuggested || q.author === 'System AI' || q.author === 'Arvid' || q.authorTeam === 'Arvid') ? 'Arvid' : q.author}>
              {(isSuggested || q.author === 'System AI' || q.author === 'Arvid' || q.authorTeam === 'Arvid') ? 'Arvid' : (q.author || 'Unknown')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          {isSuggested ? (
            <div className="flex flex-col space-y-3 w-full">
              <div className="flex items-center justify-end space-x-2">
                <span className="text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wider">
                  {q.category}
                </span>
                <div 
                  className={`w-2 h-2 rounded-full ${getImportanceClass(q.importance)}`}
                  title={q.importance}
                />
              </div>
              <div className="flex items-center space-x-2 w-full">
                <button 
                  onClick={(e) => { e.stopPropagation(); useSuggestion(q.id); }}
                  className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 bg-surface-frost-08 hover:bg-surface-frost-12 text-text-primary rounded-standard text-[11px] font-[var(--fw-medium)] transition-colors"
                >
                  <Check size={12} />
                  <span>Use Question</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); hideSuggestion(q.id); }}
                  className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 bg-surface-frost-05 hover:bg-surface-frost-10 text-text-tertiary hover:text-text-primary rounded-standard text-[11px] font-[var(--fw-medium)] transition-colors"
                >
                  <X size={12} />
                  <span>Hide</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-standard border text-[11px] font-[var(--fw-medium)] ${getStatusClass(q.status)}`}>
                {getStatusIcon(q.status)}
                <span>{q.status}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wider">
                  {q.category}
                </span>
                <div 
                  className={`w-2 h-2 rounded-full ${getImportanceClass(q.importance)}`}
                  title={q.importance}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

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

  const bottomBar = (
    <div className="relative z-[1] p-4 border-t border-border-subtle bg-surface-panel">
      <button
        onClick={() => setIsNewQuestionOpen(true)}
        className="w-full py-1.5 px-4 border border-border-default bg-surface-frost-02 rounded-comfortable text-[13px] font-[var(--fw-medium)] text-text-secondary hover:text-text-primary hover:bg-surface-frost-04 transition-colors flex items-center justify-center space-x-2"
      >
        <Plus size={14} />
        <span>Add Question</span>
      </button>
    </div>
  );

  if (questions.length === 0) {
    return (
      <div className="w-1/4 h-full flex flex-col border-r border-border-subtle bg-surface-panel">
        <div className="sticky top-0 z-10 bg-surface-panel p-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-[var(--fw-medium)] text-text-tertiary text-[11px] tracking-widest uppercase">2. Questions</h2>
          {headerControls}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-quaternary">
          {isSuggestingQuestions ? (
            <>
              <LoaderPinwheel size={32} className="mb-3 opacity-30 animate-spin" />
              <p className="text-[13px]">Arvid is analyzing the requirement...</p>
            </>
          ) : (
            <>
              <MessageCircleQuestion size={32} className="mb-3 opacity-20" />
              <p className="text-[13px]">No questions yet. Add one to start the flow.</p>
            </>
          )}
        </div>
        {bottomBar}
        <NewQuestionModal isOpen={isNewQuestionOpen} onClose={() => setIsNewQuestionOpen(false)} />
      </div>
    );
  }

  return (
    <div className="w-1/4 h-full flex flex-col border-r border-border-subtle bg-surface-panel">
      <div className="sticky top-0 z-10 bg-surface-panel p-4 border-b border-border-subtle flex items-center justify-between">
        <h2 className="font-[var(--fw-medium)] text-text-tertiary text-[11px] tracking-widest uppercase">2. Questions</h2>
        {headerControls}
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-4 space-y-4">
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
                {isExpanded ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
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
      </div>
      
      {bottomBar}
      <NewQuestionModal isOpen={isNewQuestionOpen} onClose={() => setIsNewQuestionOpen(false)} />
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Question } from '../types';
import { Plus, MessageCircleQuestion, AlertCircle, CheckCircle2, CircleDashed, ChevronDown, ChevronRight, Check, X, Eye, User, LoaderPinwheel } from 'lucide-react';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { useStore, selectQuestions, selectSelectedReqId, selectSelectedQuestionId } from '../store';

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

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: prev[group] === false ? true : false }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Answered': return <CheckCircle2 size={12} className="text-[#10b981]" />;
      case 'Conflicting': return <AlertCircle size={12} className="text-[#f59e0b]" />;
      case 'Unanswered': return <CircleDashed size={12} className="text-[#ef4444]" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Answered': return 'text-[#10b981] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)]';
      case 'Conflicting': return 'text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]';
      case 'Unanswered': return 'text-[#ef4444] bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)]';
      default: return 'text-[#8a8f98] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.05)]';
    }
  };

  const getImportanceClass = (importance: string) => {
    switch (importance) {
      case 'Critical': return 'bg-[#ef4444]';
      case 'Important': return 'bg-[#f59e0b]';
      case 'Optional': return 'bg-[#8a8f98]';
      default: return 'bg-[#8a8f98]';
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
        className={`group relative z-[1] p-4 rounded-[8px] transition-all duration-200 ease-in-out ${
          isSuggested 
            ? 'border border-dashed border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.01)] opacity-70 hover:opacity-100'
            : isSelected 
              ? 'border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] cursor-pointer' 
              : 'border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)] cursor-pointer'
        } ${isDimmed && !isSuggested ? 'opacity-30 saturate-50 hover:opacity-100 hover:saturate-100' : ''}`}
      >
        {isSelected && !isSuggested && (
          <div className="absolute top-1/2 -right-4 w-4 h-[1px] bg-[rgba(255,255,255,0.2)]" />
        )}
        {!isSuggested && (
          <div className="absolute top-1/2 -left-4 w-4 h-[1px] bg-[rgba(255,255,255,0.2)]" />
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails?.(q.id);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-[4px] text-[#8a8f98] opacity-0 group-hover:opacity-100 hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.08)] transition-all"
        >
          <Eye size={14} />
        </button>

        {isSuggested && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-[510] text-[#8a8f98] bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider border border-[rgba(255,255,255,0.05)]">AI Suggestion</span>
            </div>
          </div>
        )}
        
        <h3 className={`font-[400] text-[14px] mb-4 pr-4 leading-snug ${isSuggested ? 'text-[#8a8f98]' : 'text-[#f7f8f8]'}`}>{q.text}</h3>
        
        <div className="flex items-center text-[12px] text-[#8a8f98] mb-3 space-x-2">
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
                <span className="text-[10px] font-[510] text-[#62666d] uppercase tracking-wider">
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
                  className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-[#f7f8f8] rounded-[4px] text-[11px] font-[510] transition-colors"
                >
                  <Check size={12} />
                  <span>Use Question</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); hideSuggestion(q.id); }}
                  className="flex-1 py-1.5 flex items-center justify-center space-x-1.5 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#8a8f98] hover:text-[#f7f8f8] rounded-[4px] text-[11px] font-[510] transition-colors"
                >
                  <X size={12} />
                  <span>Hide</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] border text-[11px] font-[510] ${getStatusClass(q.status)}`}>
                {getStatusIcon(q.status)}
                <span>{q.status}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-[510] text-[#62666d] uppercase tracking-wider">
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

  if (questions.length === 0) {
    return (
      <div className="w-1/4 h-full flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#0f1011] flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-[510] text-[#8a8f98] text-[11px] tracking-widest uppercase">2. Questions</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#62666d]">
          <MessageCircleQuestion size={32} className="mb-3 opacity-20" />
          <p className="text-[13px]">No questions yet. Add one to start the flow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/4 h-full flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
      <div className="sticky top-0 z-10 bg-[#0f1011] p-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
        <h2 className="font-[510] text-[#8a8f98] text-[11px] tracking-widest uppercase">2. Questions</h2>
        <div className="flex items-center">
          <SortGroupControls 
            groupByOptions={GROUP_OPTIONS}
            sortByOptions={SORT_OPTIONS}
            currentGroup={groupBy}
            currentSort={sortBy}
            onGroupChange={setGroupBy}
            onSortChange={setSortBy}
          />
          <IconButton title="New Question">
            <Plus size={14} />
          </IconButton>
        </div>
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
                className="flex items-center text-[11px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                <span className="uppercase tracking-wider">{group}</span>
                <span className="ml-2 text-[#62666d] bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded-[4px]">{qs.length}</span>
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
      
      <div className="relative z-[1] p-4 border-t border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
        <button className="w-full py-1.5 px-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] rounded-[6px] text-[13px] font-[510] text-[#d0d6e0] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.04)] transition-colors flex items-center justify-center space-x-2">
          <Plus size={14} />
          <span>Add Question</span>
        </button>
      </div>
    </div>
  );
}

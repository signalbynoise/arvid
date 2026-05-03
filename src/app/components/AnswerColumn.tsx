import React, { useMemo, useState } from 'react';
import { Answer } from '../types';
import { Plus, MessageSquare, Check, User, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { NewAnswerModal } from './NewAnswerModal';
import { useStore, selectAnswers, selectSelectedQuestionId } from '../store';

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

export function AnswerColumn() {
  const allAnswers = useStore(selectAnswers);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const questionSelected = selectedQuestionId !== null;

  const answers = useMemo(
    () => allAnswers.filter(a => a.questionId === selectedQuestionId),
    [allAnswers, selectedQuestionId],
  );
  const toggleCurrentAnswer = useStore(s => s.toggleCurrentAnswer);

  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('date_desc');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isNewAnswerOpen, setIsNewAnswerOpen] = useState(false);

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
    <div
      id={`answer-${ans.id}`}
      key={ans.id}
      className={`relative z-[1] p-4 rounded-[8px] border transition-all duration-200 ${
        ans.isCurrent 
          ? 'border-[rgba(113,112,255,0.3)] bg-[rgba(113,112,255,0.05)] shadow-[inset_0_0_0_1px_rgba(113,112,255,0.1)]' 
          : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] opacity-70 hover:opacity-100 hover:bg-[rgba(255,255,255,0.04)]'
      }`}
    >
      <div className={`absolute top-1/2 -left-4 w-4 h-[1px] ${ans.isCurrent ? 'bg-[rgba(113,112,255,0.3)]' : 'bg-[rgba(255,255,255,0.2)]'}`} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 text-[12px] text-[#8a8f98]">
          <div className="flex items-center space-x-1.5">
            <User size={13} />
            <span className="font-[510] text-[#d0d6e0]">{ans.author}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock size={13} />
            <span>{ans.date}</span>
          </div>
        </div>
      </div>
      
      <p className="text-[14px] text-[#f7f8f8] mb-4 leading-relaxed">{ans.text}</p>
      
      <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-3">
        <button 
          onClick={() => toggleCurrentAnswer(ans.id)}
          className={`flex items-center space-x-1.5 text-[12px] font-[510] px-2.5 py-1.5 rounded-[6px] transition-colors border ${
            ans.isCurrent 
              ? 'border-[#7170ff] bg-[rgba(113,112,255,0.15)] text-[#7170ff] hover:bg-[rgba(113,112,255,0.25)]' 
              : 'border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-[#d0d6e0] hover:bg-[rgba(255,255,255,0.06)]'
          }`}
        >
          <Check size={14} className={ans.isCurrent ? 'opacity-100' : 'opacity-50'} />
          <span>{ans.isCurrent ? 'Active Answer' : 'Mark Active'}</span>
        </button>
      </div>
    </div>
  );

  if (!questionSelected) {
    return (
      <div className="w-1/4 h-full flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#0f1011] flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-[510] text-[#8a8f98] text-[11px] tracking-widest uppercase">3. Answers</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#62666d]">
          <MessageSquare size={32} className="mb-3 opacity-20" />
          <p className="text-[13px]">Select a question to view or add answers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/4 h-full flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
      <div className="sticky top-0 z-10 bg-[#0f1011] p-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
        <h2 className="font-[510] text-[#8a8f98] text-[11px] tracking-widest uppercase">3. Answers</h2>
        <div className="flex items-center">
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
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {answers.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-[rgba(255,255,255,0.1)] rounded-[8px] bg-[rgba(255,255,255,0.02)] text-[#8a8f98] text-[13px]">
            No answers yet. Be the first to clarify this.
          </div>
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
                  className="flex items-center text-[11px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                  <span className="uppercase tracking-wider">{group}</span>
                  <span className="ml-2 text-[#62666d] bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded-[4px]">{ans.length}</span>
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
      </div>
      
      <div className="relative z-[1] p-4 border-t border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
        <button
          onClick={() => setIsNewAnswerOpen(true)}
          className="w-full py-1.5 px-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] rounded-[6px] text-[13px] font-[510] text-[#d0d6e0] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.04)] transition-colors flex items-center justify-center space-x-2"
        >
          <Plus size={14} />
          <span>Add Answer</span>
        </button>
      </div>
      <NewAnswerModal isOpen={isNewAnswerOpen} onClose={() => setIsNewAnswerOpen(false)} />
    </div>
  );
}

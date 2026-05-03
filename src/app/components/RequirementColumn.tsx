import React, { useMemo, useState } from 'react';
import { Requirement } from '../types';
import { User, Plus, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { IconButton } from './IconButton';
import { SortGroupControls } from './SortGroupControls';
import { useStore, selectRequirements, selectSelectedReqId } from '../store';

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

export function RequirementColumn({ onNewReqClick, onOpenDetails }: Props) {
  const requirements = useStore(selectRequirements);
  const selectedId = useStore(selectSelectedReqId);
  const selectRequirement = useStore(s => s.selectRequirement);

  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('default');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: prev[group] === false ? true : false }));
  };

  const processedRequirements = useMemo(() => {
    let sorted = [...requirements];
    if (sortBy === 'completeness_desc') sorted.sort((a, b) => b.completeness - a.completeness);
    else if (sortBy === 'completeness_asc') sorted.sort((a, b) => a.completeness - b.completeness);
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
  }, [requirements, groupBy, sortBy]);

  const renderRequirement = (req: Requirement) => {
    const isSelected = req.id === selectedId;
    const isDimmed = selectedId !== null && !isSelected;
    
    return (
      <div
        id={`req-${req.id}`}
        key={req.id}
        onClick={() => selectRequirement(req.id)}
        className={`group relative z-[1] p-4 rounded-[8px] border cursor-pointer transition-all duration-200 ease-in-out ${
          isSelected 
            ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' 
            : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)]'
        } ${isDimmed ? 'opacity-30 saturate-50 hover:opacity-100 hover:saturate-100' : ''}`}
      >
        {isSelected && (
          <div className="absolute top-1/2 -right-4 w-4 h-[1px] bg-[rgba(255,255,255,0.2)]" />
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails?.(req.id);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-[4px] text-[#8a8f98] opacity-0 group-hover:opacity-100 hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.08)] transition-all"
        >
          <Eye size={14} />
        </button>

        <h3 className="font-[510] text-[#f7f8f8] text-[15px] mb-2 pr-6 leading-tight tracking-[-0.165px]">{req.title}</h3>
        
        <div className="flex items-center text-[13px] text-[#8a8f98] mb-3 space-x-3">
          <div className="flex items-center space-x-1.5">
            <User size={14} className="opacity-70" />
            <span className="truncate max-w-[80px]" title={req.owner}>{req.owner}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[12px] mt-3">
          <div className="flex flex-col">
            <span className="text-[#62666d] mb-1 font-[400]">Completeness</span>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    req.completeness >= 80 ? 'bg-[#10b981]' : req.completeness >= 50 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                  }`} 
                  style={{ width: `${req.completeness}%` }} 
                />
              </div>
              <span className="font-[510] text-[#d0d6e0]">{req.completeness}%</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <div className="flex flex-col items-center">
              <span className="text-[#62666d] mb-1.5 font-[400] text-[11px]">Clarity</span>
              <div 
                className={`w-2 h-2 rounded-full ${
                  req.clarity === 'High' ? 'bg-[#10b981]' : req.clarity === 'Medium' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                }`}
                title={req.clarity}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[#62666d] mb-1.5 font-[400] text-[11px]">Risk</span>
              <div 
                className={`w-2 h-2 rounded-full ${
                  req.risk === 'Low' ? 'bg-[#10b981]' : req.risk === 'Medium' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                }`}
                title={req.risk}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-1/4 h-full flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
      <div className="sticky top-0 z-10 bg-[#0f1011] p-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
        <h2 className="font-[510] text-[#8a8f98] text-[11px] tracking-widest uppercase">1. Requirements</h2>
        <div className="flex items-center">
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
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {Object.entries(processedRequirements).map(([group, reqs]) => {
          if (groupBy === 'none') {
            return <div key="all" className="space-y-3">{reqs.map(renderRequirement)}</div>;
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
                <span className="ml-2 text-[#62666d] bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded-[4px]">{reqs.length}</span>
              </button>
              
              {isExpanded && (
                <div className="space-y-3 pt-1">
                  {reqs.map(renderRequirement)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="relative z-[1] p-4 border-t border-[rgba(255,255,255,0.05)] bg-[#0f1011]">
        <button onClick={onNewReqClick} className="w-full py-1.5 px-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] rounded-[6px] text-[13px] font-[510] text-[#d0d6e0] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.04)] transition-colors flex items-center justify-center space-x-2">
          <Plus size={14} />
          <span>New Requirement</span>
        </button>
      </div>
    </div>
  );
}

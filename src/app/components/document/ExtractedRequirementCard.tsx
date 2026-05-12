import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface ExtractedRequirement {
  title: string;
  description: string;
  clarity: string;
  risk: string;
  selected: boolean;
}

interface Props {
  requirement: ExtractedRequirement;
  onToggle: () => void;
  onUpdate: (updates: Partial<ExtractedRequirement>) => void;
}

const CLARITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
const RISK_OPTIONS = ['Low', 'Medium', 'High'] as const;

export function ExtractedRequirementCard({ requirement, onToggle, onUpdate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-comfortable border transition-all duration-150 ${
        requirement.selected
          ? 'border-border-hover bg-surface-frost-06'
          : 'border-border-default bg-surface-frost-02 opacity-60'
      }`}
    >
      {/* Header row */}
      <div
        onClick={onToggle}
        className="flex items-start gap-2 p-3 cursor-pointer"
      >
        <div className={`mt-0.5 h-4 w-4 rounded-standard border flex items-center justify-center shrink-0 ${
          requirement.selected ? 'border-status-success bg-status-success' : 'border-border-default'
        }`}>
          {requirement.selected && <Check size={10} className="text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-[var(--fw-medium)] text-text-primary">
            {requirement.title}
          </p>
          <p className="text-[12px] text-text-tertiary mt-1 line-clamp-2">
            {requirement.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-text-quaternary">
              Clarity: {requirement.clarity}
            </span>
            <span className="text-[10px] text-text-quaternary">
              Risk: {requirement.risk}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="p-1 rounded-standard hover:bg-surface-frost-04 text-text-quaternary shrink-0"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded edit area */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border-subtle space-y-3" onClick={e => e.stopPropagation()}>
          <div>
            <label className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
              Title
            </label>
            <input
              type="text"
              value={requirement.title}
              onChange={e => onUpdate({ title: e.target.value })}
              className="w-full mt-1 px-2.5 py-1.5 text-[13px] bg-surface-frost-01 border border-border-default rounded-standard text-text-primary focus:outline-none focus:border-border-hover"
            />
          </div>
          <div>
            <label className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
              Description
            </label>
            <textarea
              value={requirement.description}
              onChange={e => onUpdate({ description: e.target.value })}
              rows={3}
              className="w-full mt-1 px-2.5 py-1.5 text-[13px] bg-surface-frost-01 border border-border-default rounded-standard text-text-primary focus:outline-none focus:border-border-hover resize-y"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
                Clarity
              </label>
              <select
                value={requirement.clarity}
                onChange={e => onUpdate({ clarity: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 text-[13px] bg-surface-frost-01 border border-border-default rounded-standard text-text-primary focus:outline-none focus:border-border-hover"
              >
                {CLARITY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
                Risk
              </label>
              <select
                value={requirement.risk}
                onChange={e => onUpdate({ risk: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 text-[13px] bg-surface-frost-01 border border-border-default rounded-standard text-text-primary focus:outline-none focus:border-border-hover"
              >
                {RISK_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

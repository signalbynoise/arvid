import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';

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

export function ExtractedRequirementCard({ requirement, onToggle, onUpdate }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={onToggle}
      className={`rounded-comfortable border transition-all duration-150 cursor-pointer ${
        requirement.selected
          ? 'border-border-hover bg-surface-panel'
          : 'border-border-default bg-surface-panel opacity-60'
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-caption-lg text-text-primary">
            {requirement.title}
          </p>
          <p className="text-label text-text-tertiary mt-1 line-clamp-2">
            {requirement.description}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-label-sm text-text-quaternary">
              Clarity: {requirement.clarity}
            </span>
            <span className="text-label-sm text-text-quaternary">
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

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border-subtle space-y-3" onClick={e => e.stopPropagation()}>
          <FormField label="Title">
            <TextInput
              value={requirement.title}
              onChange={(v) => onUpdate({ title: v })}
            />
          </FormField>
          <FormField label="Description">
            <TextArea
              value={requirement.description}
              onChange={(v) => onUpdate({ description: v })}
            />
          </FormField>
        </div>
      )}
    </div>
  );
}

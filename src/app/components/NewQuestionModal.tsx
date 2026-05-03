import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore, selectSelectedReqId } from '../store';
import { QuestionInputSchema } from '../../../shared/schemas';
import { BaseModal } from './BaseModal';
import { useQuestionClassification } from '../domain/useQuestionClassification';

const IMPORTANCE_OPTIONS = [
  { value: 'Critical' as const, label: 'Critical', color: 'bg-[#ef4444]' },
  { value: 'Important' as const, label: 'Important', color: 'bg-[#f59e0b]' },
  { value: 'Optional' as const, label: 'Optional', color: 'bg-[#8a8f98]' },
];

const CATEGORY_OPTIONS = ['Scope', 'Data', 'Time', 'Output', 'Quality'] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NewQuestionModal({ isOpen, onClose }: Props) {
  const createQuestion = useStore(s => s.createQuestion);
  const selectedReqId = useStore(selectSelectedReqId);
  const classification = useQuestionClassification(selectedReqId);

  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [isOpen]);

  const handleTextChange = (value: string) => {
    setText(value);
    setValidationError(null);
    classification.onTextChange(value);
  };

  const handleCreate = async () => {
    if (!selectedReqId) return;
    const result = QuestionInputSchema.safeParse({ text: text.trim() });
    if (!result.success) { setValidationError(result.error.issues[0].message); return; }
    setValidationError(null);
    setIsCreating(true);
    await createQuestion(result.data.text, selectedReqId, classification.importance, classification.category);
    setIsCreating(false);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setText('');
    setValidationError(null);
    setIsCreating(false);
    classification.reset();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="New Question" size="md">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Question</label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="What needs to be clarified about this requirement?"
            className={`w-full h-24 bg-[rgba(255,255,255,0.02)] border rounded-[8px] p-3 text-[14px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all resize-none ${
              validationError ? 'border-[rgba(239,68,68,0.5)]' : 'border-[rgba(255,255,255,0.08)]'
            }`}
          />
          {validationError && <p className="text-[12px] text-[#ef4444]">{validationError}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Importance</label>
            {classification.isClassifying && <Loader2 size={10} className="text-[#62666d] animate-spin" />}
            {classification.hasAutoClassified && !classification.isClassifying && (
              <span className="text-[10px] font-[510] text-[#62666d]">auto-detected</span>
            )}
          </div>
          <div className="flex space-x-2">
            {IMPORTANCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => classification.setImportance(opt.value)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-[6px] text-[12px] font-[510] border transition-colors ${
                  classification.importance === opt.value
                    ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)] text-[#f7f8f8]'
                    : 'border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-[#8a8f98] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${opt.color}`} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Category</label>
            {classification.isClassifying && <Loader2 size={10} className="text-[#62666d] animate-spin" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map(cat => (
              <button
                key={cat}
                onClick={() => classification.setCategory(cat)}
                className={`px-3 py-2 rounded-[6px] text-[12px] font-[510] border transition-colors ${
                  classification.category === cat
                    ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.08)] text-[#f7f8f8]'
                    : 'border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-[#8a8f98] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button onClick={handleClose} className="px-4 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors rounded-[6px]">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!text.trim() || isCreating}
            className={`px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors ${
              !text.trim() || isCreating ? 'bg-[rgba(255,255,255,0.05)] text-[#62666d] cursor-not-allowed' : 'bg-white text-black hover:bg-[#e0e0e0]'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

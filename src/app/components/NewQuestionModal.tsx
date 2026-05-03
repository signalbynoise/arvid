import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore, selectSelectedReqId } from '../store';
import { QuestionInputSchema } from '../../../shared/schemas';
import { BaseModal } from './BaseModal';
import { useQuestionClassification } from '../domain/useQuestionClassification';

const IMPORTANCE_OPTIONS = [
  { value: 'Critical' as const, label: 'Critical', color: 'bg-status-error' },
  { value: 'Important' as const, label: 'Important', color: 'bg-status-warning' },
  { value: 'Optional' as const, label: 'Optional', color: 'bg-text-tertiary' },
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
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Question</label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="What needs to be clarified about this requirement?"
            className={`w-full h-24 bg-surface-frost-02 border rounded-card p-3 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all resize-none ${
              validationError ? 'border-status-error-border-focus' : 'border-border-default'
            }`}
          />
          {validationError && <p className="text-[12px] text-status-error">{validationError}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Importance</label>
            {classification.isClassifying && <Loader2 size={10} className="text-text-quaternary animate-spin" />}
            {classification.hasAutoClassified && !classification.isClassifying && (
              <span className="text-[10px] font-[var(--fw-medium)] text-text-quaternary">auto-detected</span>
            )}
          </div>
          <div className="flex space-x-2">
            {IMPORTANCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => classification.setImportance(opt.value)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-comfortable text-[12px] font-[var(--fw-medium)] border transition-colors ${
                  classification.importance === opt.value
                    ? 'border-border-focus bg-surface-frost-08 text-text-primary'
                    : 'border-border-subtle bg-surface-frost-02 text-text-tertiary hover:bg-surface-frost-04'
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
            <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Category</label>
            {classification.isClassifying && <Loader2 size={10} className="text-text-quaternary animate-spin" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map(cat => (
              <button
                key={cat}
                onClick={() => classification.setCategory(cat)}
                className={`px-3 py-2 rounded-comfortable text-[12px] font-[var(--fw-medium)] border transition-colors ${
                  classification.category === cat
                    ? 'border-border-focus bg-surface-frost-08 text-text-primary'
                    : 'border-border-subtle bg-surface-frost-02 text-text-tertiary hover:bg-surface-frost-04'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button onClick={handleClose} className="px-4 py-2 text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors rounded-comfortable">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!text.trim() || isCreating}
            className={`px-4 py-2 text-[13px] font-[var(--fw-medium)] rounded-comfortable transition-colors ${
              !text.trim() || isCreating ? 'bg-surface-frost-05 text-text-quaternary cursor-not-allowed' : 'bg-white text-black hover:bg-btn-primary-hover'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useStore, selectSelectedQuestionId } from '../store';
import { AnswerInputSchema } from '../../../shared/schemas';
import { BaseModal } from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NewAnswerModal({ isOpen, onClose }: Props) {
  const createAnswer = useStore(s => s.createAnswer);
  const selectedQuestionId = useStore(selectSelectedQuestionId);

  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [isOpen]);

  const handleCreate = async () => {
    if (!selectedQuestionId) return;
    const result = AnswerInputSchema.safeParse({ text: text.trim(), author: author.trim() });
    if (!result.success) { setValidationError(result.error.issues[0].message); return; }
    setValidationError(null);
    setIsCreating(true);
    await createAnswer(result.data.text, selectedQuestionId, result.data.author);
    setIsCreating(false);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setText('');
    setAuthor('');
    setValidationError(null);
    setIsCreating(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="New Answer" size="md">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Answer</label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setValidationError(null); }}
            placeholder="Provide your answer or clarification..."
            className={`w-full h-28 bg-surface-frost-02 border rounded-card p-3 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all resize-none ${
              validationError && !text.trim() ? 'border-status-error-border-focus' : 'border-border-default'
            }`}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => { setAuthor(e.target.value); setValidationError(null); }}
            placeholder="Your name"
            className={`w-full bg-surface-frost-02 border rounded-comfortable px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all ${
              validationError && !author.trim() ? 'border-status-error-border-focus' : 'border-border-default'
            }`}
          />
          {validationError && <p className="text-[12px] text-status-error">{validationError}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button onClick={handleClose} className="px-4 py-2 text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors rounded-comfortable">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!text.trim() || !author.trim() || isCreating}
            className={`px-4 py-2 text-[13px] font-[var(--fw-medium)] rounded-comfortable transition-colors ${
              !text.trim() || !author.trim() || isCreating ? 'bg-surface-frost-05 text-text-quaternary cursor-not-allowed' : 'bg-white text-black hover:bg-btn-primary-hover'
            }`}
          >
            {isCreating ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

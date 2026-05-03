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
          <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Answer</label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setValidationError(null); }}
            placeholder="Provide your answer or clarification..."
            className={`w-full h-28 bg-[rgba(255,255,255,0.02)] border rounded-[8px] p-3 text-[14px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all resize-none ${
              validationError && !text.trim() ? 'border-[rgba(239,68,68,0.5)]' : 'border-[rgba(255,255,255,0.08)]'
            }`}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => { setAuthor(e.target.value); setValidationError(null); }}
            placeholder="Your name"
            className={`w-full bg-[rgba(255,255,255,0.02)] border rounded-[6px] px-3 py-2.5 text-[14px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all ${
              validationError && !author.trim() ? 'border-[rgba(239,68,68,0.5)]' : 'border-[rgba(255,255,255,0.08)]'
            }`}
          />
          {validationError && <p className="text-[12px] text-[#ef4444]">{validationError}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button onClick={handleClose} className="px-4 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors rounded-[6px]">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!text.trim() || !author.trim() || isCreating}
            className={`px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors ${
              !text.trim() || !author.trim() || isCreating ? 'bg-[rgba(255,255,255,0.05)] text-[#62666d] cursor-not-allowed' : 'bg-white text-black hover:bg-[#e0e0e0]'
            }`}
          >
            {isCreating ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useStore, selectSelectedQuestionId } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextArea } from './ui/TextArea';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NewAnswerModal({ isOpen, onClose }: Props) {
  const createAnswer = useStore(s => s.createAnswer);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const { user } = useAuth();

  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [isOpen]);

  const authorName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || 'Unknown';

  const handleCreate = async () => {
    if (!selectedQuestionId) return;
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setValidationError('Answer must be at least 2 characters');
      return;
    }
    setValidationError(null);
    setIsCreating(true);
    await createAnswer(trimmed, selectedQuestionId, authorName);
    setIsCreating(false);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setText('');
    setValidationError(null);
    setIsCreating(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="New Answer" size="md">
      <div className="flex flex-col gap-6">
        <FormField
          label="Answer"
          error={validationError}
          hint={<>Answering as <span className="text-text-secondary font-[var(--fw-medium)]">{authorName}</span></>}
        >
          <TextArea
            value={text}
            onChange={(v) => { setText(v); setValidationError(null); }}
            placeholder="Provide your answer or clarification..."
            hasError={!!validationError}
            textareaRef={textareaRef}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleCreate} disabled={!text.trim() || isCreating} className="btn-primary">
            {isCreating ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

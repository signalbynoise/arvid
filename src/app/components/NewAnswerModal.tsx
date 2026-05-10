import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, selectSelectedQuestionId } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { useCreateEntity } from '../machines/mutations/useCreateEntity';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextArea } from './ui/TextArea';
import { SubmitButton } from './ui/SubmitButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NewAnswerModal({ isOpen, onClose }: Props) {
  const createAnswer = useStore(s => s.createAnswer);
  const selectedQuestionId = useStore(selectSelectedQuestionId);
  const { user } = useAuth();

  const authorName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || 'Unknown';

  const { error, isSubmitting, submit, reset } = useCreateEntity({
    entityType: 'answer',
    create: async (payload) => {
      await createAnswer(payload.text as string, payload.questionId as string, payload.authorName as string);
    },
    onClose,
  });

  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    if (!selectedQuestionId) return;
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setValidationError('Answer must be at least 2 characters');
      return;
    }
    setValidationError(null);
    submit({ text: trimmed, questionId: selectedQuestionId, authorName });
  }, [text, selectedQuestionId, authorName, submit]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey && !isSubmitting) {
        e.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isSubmitting, handleSubmit]);

  const handleClose = () => {
    onClose();
    setText('');
    setValidationError(null);
    reset();
  };

  const displayError = validationError || error;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="New Answer" size="md">
      <div className="flex flex-col gap-6">
        <FormField
          label="Answer"
          error={displayError}
          hint={<>Answering as <span className="text-text-secondary font-[var(--fw-medium)]">{authorName}</span></>}
        >
          <TextArea
            value={text}
            onChange={(v) => { setText(v); setValidationError(null); }}
            placeholder="Provide your answer or clarification..."
            hasError={!!displayError}
            textareaRef={textareaRef}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <SubmitButton onClick={handleSubmit} disabled={!text.trim()} label="Submit" loadingLabel="Submitting..." isLoading={isSubmitting} />
        </div>
      </div>
    </BaseModal>
  );
}

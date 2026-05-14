import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectSelectedReqId } from '../store';
import { QuestionInputSchema } from '../../../shared/schemas';
import { useCreateEntity } from '../machines/mutations/useCreateEntity';
import { BaseModal } from './BaseModal';
import { ModalFooter } from './ui/ModalFooter';
import { FormField } from './ui/FormField';
import { TextArea } from './ui/TextArea';
import { useQuestionClassification } from '../domain/useQuestionClassification';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NewQuestionModal({ isOpen, onClose }: Props) {
  const createQuestion = useStore(s => s.createQuestion);
  const selectedReqId = useStore(selectSelectedReqId);
  const classification = useQuestionClassification(selectedReqId);

  const { error, isSubmitting, submit, reset } = useCreateEntity({
    entityType: 'question',
    create: async (payload) => {
      await createQuestion(
        payload.text as string,
        payload.requirementId as string,
        payload.importance as string,
        payload.category as string,
      );
    },
    onClose,
  });

  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setValidationError(null);
      classification.reset();
      reset();
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleTextChange = (value: string) => {
    setText(value);
    setValidationError(null);
    classification.onTextChange(value);
  };

  const handleSubmit = useCallback(() => {
    if (!selectedReqId) return;
    const result = QuestionInputSchema.safeParse({ text: text.trim() });
    if (!result.success) { setValidationError(result.error.issues[0].message); return; }
    setValidationError(null);
    submit({
      text: result.data.text,
      requirementId: selectedReqId,
      importance: classification.importance,
      category: classification.category,
    });
  }, [text, selectedReqId, classification.importance, classification.category, submit]);

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
    classification.reset();
    reset();
  };

  const displayError = validationError || error;

  const modalFooter = (
    <ModalFooter>
      <button onClick={handleClose} className="btn-ghost">Cancel</button>
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || isSubmitting}
        className="btn-primary flex items-center gap-2"
      >
        <LoaderPinwheel size={ICON_SIZE.md} />
        <span>{isSubmitting ? 'Checking...' : 'Check with Arvid'}</span>
      </button>
    </ModalFooter>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="New Question" size="md" footer={modalFooter}>
      <FormField label="Question" error={displayError}>
        <TextArea
          value={text}
          onChange={handleTextChange}
          placeholder="What needs to be clarified about this requirement?"
          hasError={!!displayError}
          textareaRef={textareaRef}
        />
      </FormField>
    </BaseModal>
  );
}

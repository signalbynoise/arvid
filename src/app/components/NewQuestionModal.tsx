import React, { useState, useEffect, useRef } from 'react';
import { LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectSelectedReqId } from '../store';
import { QuestionInputSchema } from '../../../shared/schemas';
import { BaseModal } from './BaseModal';
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
      <div className="flex flex-col gap-6">
        <FormField label="Question" error={validationError}>
          <TextArea
            value={text}
            onChange={handleTextChange}
            placeholder="What needs to be clarified about this requirement?"
            hasError={!!validationError}
            textareaRef={textareaRef}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!text.trim() || isCreating}
            className="btn-primary flex items-center gap-2"
          >
            <LoaderPinwheel size={ICON_SIZE.md} />
            <span>{isCreating ? 'Checking...' : 'Check with Arvid'}</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

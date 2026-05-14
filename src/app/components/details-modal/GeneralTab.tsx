import React from 'react';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';

interface GeneralTabProps {
  type: 'requirement' | 'question' | 'answer';
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  confirmDelete: boolean;
  onConfirmDelete: (v: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
  isCurrent?: boolean;
}

export function GeneralTab({
  type,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  confirmDelete,
  onConfirmDelete,
  isDeleting,
  onDelete,
  isCurrent,
}: GeneralTabProps) {
  const isReq = type === 'requirement';
  const isQuestion = type === 'question';
  const isAnswer = type === 'answer';

  return (
    <div className="p-6 space-y-6">
      <FormField label={isReq ? 'Title' : isQuestion ? 'Question' : 'Answer'}>
        <TextInput
          value={title}
          onChange={onTitleChange}
          placeholder={isReq ? 'Requirement title...' : isQuestion ? 'Question text...' : 'Answer text...'}
        />
      </FormField>

      {(isReq || isQuestion) && (
        <FormField label="Description">
          <TextArea
            value={description}
            onChange={onDescriptionChange}
            placeholder="Add a detailed description..."
          />
        </FormField>
      )}

      {isAnswer && (
        <FormField label="Status">
          <p className="text-caption-lg text-text-primary py-1">
            {isCurrent ? 'Active Answer' : 'Inactive'}
          </p>
        </FormField>
      )}

      {confirmDelete && (
        <div className="flex items-center justify-between p-3 rounded-card border border-status-error-border-focus bg-status-error-surface">
          <p className="text-caption-lg text-status-error">
            {isReq
              ? 'Delete this requirement and all its questions, answers, and summaries?'
              : isQuestion
                ? 'Delete this question and all its answers?'
                : 'Delete this answer?'}
          </p>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button onClick={() => onConfirmDelete(false)} className="btn-ghost">Cancel</button>
            <button onClick={onDelete} disabled={isDeleting} className="btn-primary">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

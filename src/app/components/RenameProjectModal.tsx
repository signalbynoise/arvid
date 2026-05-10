import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ProjectNameSchema } from '../../../shared/schemas';
import { useRenameEntity } from '../machines/mutations/useRenameEntity';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentName: string;
}

export function RenameProjectModal({ isOpen, onClose, projectId, currentName }: Props) {
  const updateProject = useStore(s => s.updateProject);
  const { error, isSubmitting, submit, reset } = useRenameEntity({
    entityType: 'project',
    entityId: projectId,
    currentName,
    rename: updateProject,
    onClose,
  });

  const [name, setName] = useState(currentName);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setValidationError(null);
      reset();
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentName, reset]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed === currentName) { onClose(); return; }

    const result = ProjectNameSchema.safeParse({ name: trimmed });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }
    setValidationError(null);
    submit(result.data.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
  };

  const displayError = validationError || error;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Rename Project" size="sm">
      <div className="flex flex-col gap-6">
        <FormField label="Name" error={displayError}>
          <TextInput
            value={name}
            onChange={(v) => { setName(v); setValidationError(null); }}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            hasError={!!displayError}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { ProjectNameSchema } from '../../../shared/schemas';
import { useCreateProject } from '../machines/mutations/useCreateProject';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  teamId: string;
  teamName: string;
  parentId?: string;
  parentName?: string;
}

export function NewProjectModal({ isOpen, onClose, workspaceId, teamId, teamName, parentId, parentName }: Props) {
  const { error, isSubmitting, submit, reset } = useCreateProject(onClose);
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleSubmit = () => {
    const result = ProjectNameSchema.safeParse({ name: name.trim() });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }
    setValidationError(null);
    submit(result.data.name, workspaceId, teamId, parentId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
    setValidationError(null);
    reset();
  };

  const displayError = validationError || error;
  const isSubProject = !!parentId;
  const title = isSubProject ? 'Create new sub project' : 'Create new project';
  const fieldLabel = isSubProject ? 'Sub Project Name' : 'Project Name';
  const hint = isSubProject
    ? <>Sub-project will be added to project <span className="text-text-primary">{parentName}</span></>
    : <>Project will be added to team <span className="text-text-primary">{teamName}</span></>;
  const submitLabel = isSubProject ? 'Create new sub project' : 'Create new project';

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="flex flex-col gap-6">
        <FormField label={fieldLabel} error={displayError} hint={hint}>
          <TextInput
            value={name}
            onChange={(v) => { setName(v); setValidationError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Project name"
            inputRef={inputRef}
            hasError={!!displayError}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating...' : submitLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

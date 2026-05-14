import React, { useState, useEffect, useRef } from 'react';
import { ProjectNameSchema } from '../../../shared/schemas';
import { useCreateProject } from '../machines/mutations/useCreateProject';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { SubmitButton } from './ui/SubmitButton';
import { ModalFooter } from './ui/ModalFooter';

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

  const modalFooter = (
    <ModalFooter>
      <button onClick={handleClose} className="btn-ghost">Cancel</button>
      <SubmitButton onClick={handleSubmit} disabled={!name.trim()} label={submitLabel} isLoading={isSubmitting} />
    </ModalFooter>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={title} size="sm" footer={modalFooter}>
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
    </BaseModal>
  );
}

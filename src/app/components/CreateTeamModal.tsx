import React, { useState, useEffect, useRef } from 'react';
import { useCreateTeam } from '../machines/mutations/useCreateTeam';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { SubmitButton } from './ui/SubmitButton';
import { ModalFooter } from './ui/ModalFooter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
}

export function CreateTeamModal({ isOpen, onClose, workspaceId, workspaceName }: Props) {
  const { error, isSubmitting, submit, reset } = useCreateTeam(onClose);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleSubmit = () => {
    if (name.trim() && workspaceId) submit(name, workspaceId);
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
    reset();
  };

  const modalFooter = (
    <ModalFooter>
      <button onClick={handleClose} className="btn-ghost">Cancel</button>
      <SubmitButton onClick={handleSubmit} disabled={!name.trim()} label="Create new team" loadingLabel="Creating..." isLoading={isSubmitting} />
    </ModalFooter>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create new team" size="sm" footer={modalFooter}>
      <FormField
        label="Team Name"
        error={error}
        hint={<>Team will be added to workspace <span className="text-text-primary">{workspaceName}</span></>}
      >
        <TextInput
          value={name}
          onChange={(v) => setName(v)}
          onKeyDown={handleKeyDown}
          placeholder="Team name"
          inputRef={inputRef}
          hasError={!!error}
        />
      </FormField>
    </BaseModal>
  );
}

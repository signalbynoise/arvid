import React, { useState, useEffect, useRef } from 'react';
import { useCreateTeam } from '../machines/mutations/useCreateTeam';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';

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

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create new team" size="sm">
      <div className="flex flex-col gap-6">
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

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating...' : 'Create new team'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

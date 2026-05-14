import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useRenameEntity } from '../machines/mutations/useRenameEntity';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { SubmitButton } from './ui/SubmitButton';
import { ModalFooter } from './ui/ModalFooter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  currentName: string;
}

export function RenameTeamModal({ isOpen, onClose, teamId, currentName }: Props) {
  const updateTeam = useStore(s => s.updateTeam);
  const { error, isSubmitting, submit, reset } = useRenameEntity({
    entityType: 'team',
    entityId: teamId,
    currentName,
    rename: updateTeam,
    onClose,
  });

  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      reset();
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentName, reset]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed === currentName) { onClose(); return; }
    submit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
  };

  const modalFooter = (
    <ModalFooter>
      <button onClick={onClose} className="btn-ghost">Cancel</button>
      <SubmitButton onClick={handleSubmit} disabled={!name.trim()} label="Save" loadingLabel="Saving..." isLoading={isSubmitting} />
    </ModalFooter>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Rename Team" size="sm" footer={modalFooter}>
      <FormField label="Team Name" error={error}>
        <TextInput
          value={name}
          onChange={(v) => setName(v)}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          hasError={!!error}
        />
      </FormField>
    </BaseModal>
  );
}

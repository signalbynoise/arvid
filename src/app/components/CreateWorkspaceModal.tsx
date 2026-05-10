import React, { useState, useEffect, useRef } from 'react';
import { generateSlug } from '../domain/workspaces';
import { useCreateWorkspace } from '../machines/mutations/useCreateWorkspace';
import { BaseModal } from './BaseModal';
import { FormField } from './ui/FormField';
import { TextInput } from './ui/TextInput';
import { SubmitButton } from './ui/SubmitButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: Props) {
  const { error, isSubmitting, submit, reset } = useCreateWorkspace(onClose);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const slug = name.trim() ? generateSlug(name) : '';

  const handleSubmit = () => {
    if (name.trim()) submit(name);
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

  const hint = slug
    ? <>Slug: <span className="font-mono text-text-tertiary">{slug}</span></>
    : undefined;

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create Workspace" size="sm">
      <div className="flex flex-col gap-6">
        <FormField label="Name" error={error} hint={hint}>
          <TextInput
            value={name}
            onChange={(v) => setName(v)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Acme Corp"
            inputRef={inputRef}
            hasError={!!error}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <SubmitButton onClick={handleSubmit} disabled={!name.trim()} label="Create" loadingLabel="Creating..." isLoading={isSubmitting} />
        </div>
      </div>
    </BaseModal>
  );
}

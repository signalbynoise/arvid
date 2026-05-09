import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, selectWorkspaces, selectActiveWorkspaceId, selectTeams } from '../store';
import { ProjectNameSchema } from '../../../shared/schemas';
import { buildProjectPathFromEntities } from '../domain/paths';
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
  const navigate = useNavigate();
  const createProject = useStore(s => s.createProject);
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);

  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const handleCreate = async () => {
    const result = ProjectNameSchema.safeParse({ name: name.trim() });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }
    setValidationError(null);
    setIsCreating(true);
    const created = await createProject(result.data.name, parentId, workspaceId, teamId);
    setIsCreating(false);
    handleClose();
    if (created) {
      const workspace = workspaces.find(w => w.id === activeWorkspaceId);
      if (workspace) {
        const path = buildProjectPathFromEntities(workspace, teams, created);
        if (path) navigate(path);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
    setValidationError(null);
    setIsCreating(false);
  };

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
        <FormField label={fieldLabel} error={validationError} hint={hint}>
          <TextInput
            value={name}
            onChange={(v) => { setName(v); setValidationError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Project name"
            inputRef={inputRef}
            hasError={!!validationError}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim() || isCreating} className="btn-primary">
            {isCreating ? 'Creating...' : submitLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

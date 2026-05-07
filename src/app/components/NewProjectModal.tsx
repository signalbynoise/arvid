import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Folder, Hash, Users } from 'lucide-react';
import { useStore, selectProjects, selectActiveWorkspaceId, selectTeams } from '../store';
import { ProjectNameSchema } from '../../../shared/schemas';
import { buildProjectTree, ProjectTreeNode } from '../domain/projects';
import { BaseModal } from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultParentId?: string;
  defaultTeamId?: string;
}

export function NewProjectModal({ isOpen, onClose, defaultParentId, defaultTeamId }: Props) {
  const createProject = useStore(s => s.createProject);
  const projects = useStore(selectProjects);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const teams = useStore(selectTeams);
  const tree = useMemo(() => buildProjectTree(projects), [projects]);

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(defaultParentId);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setParentId(defaultParentId);
      if (defaultTeamId) {
        setSelectedTeamId(defaultTeamId);
      } else if (teams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teams[0].id);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultParentId, defaultTeamId, teams, selectedTeamId]);

  const handleCreate = async () => {
    const result = ProjectNameSchema.safeParse({ name: name.trim() });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }
    setValidationError(null);
    setIsCreating(true);

    await createProject(result.data.name, parentId, activeWorkspaceId ?? undefined, selectedTeamId);

    setIsCreating(false);
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleCreate();
    }
  };

  const reset = () => {
    setName('');
    setParentId(undefined);
    setSelectedTeamId(teams.length > 0 ? teams[0].id : undefined);
    setValidationError(null);
    setIsCreating(false);
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const selectedParent = parentId ? projects.find(p => p.id === parentId) : null;

  const renderParentOption = (node: ProjectTreeNode, depth = 0) => {
    const isSelected = parentId === node.id;
    return (
      <React.Fragment key={node.id}>
        <button
          onClick={() => setParentId(node.id)}
          className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-standard text-[13px] font-[var(--fw-medium)] transition-colors text-left ${
            isSelected
              ? 'bg-surface-frost-08 text-text-primary'
              : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
          }`}
          style={{ '--depth': depth } as React.CSSProperties}
        >
          {depth === 0 ? <Folder size={14} /> : <Hash size={14} />}
          <span className="truncate">{node.name}</span>
        </button>
        {node.children.map(child => renderParentOption(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={defaultParentId ? 'New Sub-project' : 'New Project'}
      size="sm"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
            Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setValidationError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Platform Migration"
            className={`w-full bg-surface-frost-02 border rounded-comfortable px-3 py-2.5 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all ${
              validationError ? 'border-status-error-border-focus' : 'border-border-default'
            }`}
          />
          {validationError && (
            <p className="text-[12px] text-status-error">{validationError}</p>
          )}
        </div>

        {teams.length > 0 && (
          <div className="space-y-2">
            <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
              Team
            </label>
            <div className="bg-surface-frost-02 border border-border-default rounded-card p-1.5 max-h-[120px] overflow-y-auto hide-scrollbar space-y-0.5">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-standard text-[13px] font-[var(--fw-medium)] transition-colors text-left ${
                    selectedTeamId === team.id
                      ? 'bg-surface-frost-08 text-text-primary'
                      : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
                  }`}
                >
                  <Users size={14} />
                  <span className="truncate">{team.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tree.length > 0 && (
          <div className="space-y-2">
            <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
              Parent Project
              <span className="text-text-quaternary normal-case tracking-normal ml-1">(optional)</span>
            </label>

            <div className="bg-surface-frost-02 border border-border-default rounded-card p-1.5 max-h-[160px] overflow-y-auto hide-scrollbar space-y-0.5">
              <button
                onClick={() => setParentId(undefined)}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-standard text-[13px] font-[var(--fw-medium)] transition-colors text-left ${
                  !parentId
                    ? 'bg-surface-frost-08 text-text-primary'
                    : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
                }`}
              >
                <span className="text-text-quaternary">&mdash;</span>
                <span>None (top-level)</span>
              </button>
              {tree.map(node => renderParentOption(node))}
            </div>

            {selectedParent && (
              <p className="text-[12px] text-text-quaternary">
                Will be created as a sub-project of <span className="text-text-tertiary font-[var(--fw-medium)]">{selectedParent.name}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-3 border-t border-border-subtle">
          <button onClick={handleClose} className="btn-ghost px-4 py-1.5">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim() || isCreating} className="btn-primary px-4 py-1.5">
            {isCreating ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-surface-frost-08 border-t-black rounded-full animate-spin" />
                <span>Creating...</span>
              </span>
            ) : (
              <span>Create</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

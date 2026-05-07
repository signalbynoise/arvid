import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Pencil, Settings, Trash2, GitCompare, LoaderPinwheel, ToggleRight, ToggleLeft } from 'lucide-react';
import { useStore, selectWorkspaces, selectActiveWorkspaceId } from '../store';
import { buildWorkspacePath } from '../domain/paths';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';

interface WorkspacePickerProps {
  onSettingsClick: () => void;
  onCreateClick: () => void;
  onCreateTeamClick: () => void;
  onInviteClick: () => void;
  onRenameClick: () => void;
  onDeactivateClick: () => void;
}

export function WorkspacePicker({ onSettingsClick, onCreateClick, onCreateTeamClick, onInviteClick, onRenameClick, onDeactivateClick }: WorkspacePickerProps) {
  const navigate = useNavigate();
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canDeactivate = useStore(s => s.deactivationMap.workspace);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleSelect = (ws: typeof workspaces[number]) => {
    navigate(buildWorkspacePath(ws.shortId ?? ws.slug));
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1 min-w-0" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="group flex items-center gap-2 w-full transition-colors"
      >
        {activeWorkspace?.logoUrl ? (
          <img
            src={activeWorkspace.logoUrl}
            alt=""
            className="w-3.5 h-3.5 rounded-micro object-cover shrink-0"
          />
        ) : (
          <LoaderPinwheel size={14} className="text-text-primary shrink-0" />
        )}
        <span className="text-caption-lg text-text-primary truncate">
          {activeWorkspace?.name ?? 'No workspace'}
        </span>
        <ChevronDown size={14} className="text-text-quaternary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {isOpen && (
        <DropdownPanel position="below">
          <DropdownSection label="WORKSPACES">
            {workspaces.map(ws => (
              <DropdownItem
                key={ws.id}
                icon={<GitCompare size={16} />}
                label={ws.name}
                right={
                  ws.id === activeWorkspaceId
                    ? <ToggleRight size={16} className="text-status-success" />
                    : <ToggleLeft size={16} className="text-text-quaternary" />
                }
                onClick={() => handleSelect(ws)}
                variant={ws.id === activeWorkspaceId ? 'default' : 'muted'}
              />
            ))}
          </DropdownSection>

          <DropdownDivider />

          <DropdownSection label="ACTIONS">
            <DropdownItem
              icon={<Plus size={16} />}
              label="Add user to workspace"
              onClick={() => { setIsOpen(false); onInviteClick(); }}
            />
            <DropdownItem
              icon={<Pencil size={16} />}
              label="Rename workspace"
              onClick={() => { setIsOpen(false); onRenameClick(); }}
            />
            <DropdownItem
              icon={<Plus size={16} />}
              label="Create new team"
              onClick={() => { setIsOpen(false); onCreateTeamClick(); }}
            />
            <DropdownItem
              icon={<Plus size={16} />}
              label="Create new workspace"
              onClick={() => { setIsOpen(false); onCreateClick(); }}
            />
          </DropdownSection>

          <DropdownDivider />

          <DropdownSection label="GENERAL">
            <DropdownItem
              icon={<Settings size={16} />}
              label="Workspace settings"
              onClick={() => { setIsOpen(false); onSettingsClick(); }}
            />
          </DropdownSection>

          {canDeactivate && (
            <>
              <DropdownDivider />
              <DropdownSection label="AVOID">
                <DropdownItem
                  icon={<Trash2 size={16} />}
                  label="Deactivate workspace"
                  variant="muted"
                  right={<ToggleRight size={16} className="text-status-success" />}
                  onClick={() => { setIsOpen(false); onDeactivateClick(); }}
                />
              </DropdownSection>
            </>
          )}
        </DropdownPanel>
      )}
    </div>
  );
}

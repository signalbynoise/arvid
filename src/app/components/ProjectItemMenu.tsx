import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Pencil, Network, Settings2, Trash2, MoreHorizontal, ToggleRight } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { useStore, selectWorkspaces, selectActiveWorkspaceId } from '../store';
import { canManageProject, canMoveProject } from '../domain/access';

interface Props {
  projectId: string;
  onAddUser: () => void;
  onRename: () => void;
  onMove: () => void;
  onCreateSubProject?: () => void;
  onSettings: () => void;
  onDeactivate: () => void;
}

export function ProjectItemMenu({ projectId, onAddUser, onRename, onMove, onCreateSubProject, onSettings, onDeactivate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canDeactivate = useStore(s => s.deactivationMap.projects[projectId] ?? false);
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const userRole = workspaces.find(w => w.id === activeWorkspaceId)?.userRole;

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (menuRef.current?.contains(target)) return;
    if (panelRef.current?.contains(target)) return;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  return (
    <div className="relative" ref={menuRef} data-menu-open={isOpen || undefined}>
      <IconButton onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }}>
        <MoreHorizontal size={ICON_SIZE.sm} />
      </IconButton>

      <DropdownPanel isOpen={isOpen} position="right" anchorRef={menuRef} panelRef={panelRef}>
        <DropdownSection label="ACTIONS">
          {canManageProject(userRole) && (
            <DropdownItem icon={<Plus size={ICON_SIZE.sm} />} label="Add user to project" onClick={() => { setIsOpen(false); onAddUser(); }} />
          )}
          {canManageProject(userRole) && (
            <DropdownItem icon={<Pencil size={ICON_SIZE.sm} />} label="Rename project" onClick={() => { setIsOpen(false); onRename(); }} />
          )}
          {canMoveProject(userRole) && (
            <DropdownItem icon={<Network size={ICON_SIZE.sm} />} label="Move project" onClick={() => { setIsOpen(false); onMove(); }} />
          )}
          {onCreateSubProject && canManageProject(userRole) && (
            <DropdownItem icon={<Plus size={ICON_SIZE.sm} />} label="Create sub-project" onClick={() => { setIsOpen(false); onCreateSubProject(); }} />
          )}
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection label="GENERAL">
          <DropdownItem icon={<Settings2 size={ICON_SIZE.sm} />} label="All project settings" onClick={() => { setIsOpen(false); onSettings(); }} />
        </DropdownSection>

        {canDeactivate && (
          <>
            <DropdownDivider />
            <DropdownSection label="AVOID">
              <DropdownItem
                icon={<Trash2 size={ICON_SIZE.sm} />}
                label="Deactivate project"
                variant="muted"
                right={<ToggleRight size={ICON_SIZE.sm} className="text-status-success" />}
                onClick={() => { setIsOpen(false); onDeactivate(); }}
              />
            </DropdownSection>
          </>
        )}
      </DropdownPanel>
    </div>
  );
}

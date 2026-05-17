import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Pencil, Network, Settings2, Trash2, MoreHorizontal, ToggleRight } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { useStore, selectWorkspaces, selectActiveWorkspaceId } from '../store';
import { canManageAtLevel, canViewAtLevel } from '../domain/access';

interface Props {
  teamId: string;
  onAddUser: () => void;
  onRename: () => void;
  onMove: () => void;
  onCreateProject: () => void;
  onSettings: () => void;
  onDeactivate: () => void;
}

export function TeamItemMenu({ teamId, onAddUser, onRename, onMove, onCreateProject, onSettings, onDeactivate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canDeactivate = useStore(s => s.deactivationMap.teams[teamId] ?? false);
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const userRole = workspaces.find(w => w.id === activeWorkspaceId)?.userRole;
  const canManage = canManageAtLevel(userRole, 'team');
  const canView = canViewAtLevel(userRole);

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
        {canManage && (
          <DropdownSection label="ACTIONS">
            <DropdownItem icon={<Plus size={ICON_SIZE.sm} />} label="Add user to team" onClick={() => { setIsOpen(false); onAddUser(); }} />
            <DropdownItem icon={<Pencil size={ICON_SIZE.sm} />} label="Rename team" onClick={() => { setIsOpen(false); onRename(); }} />
            <DropdownItem icon={<Network size={ICON_SIZE.sm} />} label="Move team" onClick={() => { setIsOpen(false); onMove(); }} />
            <DropdownItem icon={<Plus size={ICON_SIZE.sm} />} label="Create project" onClick={() => { setIsOpen(false); onCreateProject(); }} />
          </DropdownSection>
        )}

        {canView && (
          <>
            {canManage && <DropdownDivider />}
            <DropdownSection label="GENERAL">
              <DropdownItem icon={<Settings2 size={ICON_SIZE.sm} />} label="All team settings" onClick={() => { setIsOpen(false); onSettings(); }} />
            </DropdownSection>
          </>
        )}

        {canDeactivate && (
          <>
            <DropdownDivider />
            <DropdownSection label="AVOID">
              <DropdownItem
                icon={<Trash2 size={ICON_SIZE.sm} />}
                label="Deactivate team"
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

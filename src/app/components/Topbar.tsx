import React, { useMemo } from 'react';
import { PanelLeft } from 'lucide-react';
import { IconButton } from './IconButton';
import { UserMenu } from './UserMenu';
import { useStore, selectWorkspaces, selectActiveWorkspaceId, selectProjects, selectSelectedProjectId, selectTeams } from '../store';

interface TopbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ isSidebarOpen, onToggleSidebar }: TopbarProps) {
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const projects = useStore(selectProjects);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const teams = useStore(selectTeams);

  const breadcrumbs = useMemo(() => {
    const workspace = workspaces.find(w => w.id === activeWorkspaceId);
    const project = projects.find(p => p.id === selectedProjectId);
    const team = project?.teamId ? teams.find(t => t.id === project.teamId) : null;
    return [workspace?.name, team?.name, project?.name].filter(Boolean) as string[];
  }, [workspaces, activeWorkspaceId, projects, selectedProjectId, teams]);

  return (
    <div className="border-b border-border-subtle flex items-center px-4 py-3 bg-surface-panel shrink-0 relative z-30">
      <div className="flex items-center gap-2 min-w-0">
        <IconButton
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelLeft size={14} />
        </IconButton>
        {breadcrumbs.length > 0 && (
          <span className="text-caption-lg text-text-tertiary truncate">
            {breadcrumbs.join(' / ')}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center shrink-0">
        <UserMenu />
      </div>
    </div>
  );
}

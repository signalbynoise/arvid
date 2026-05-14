import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectWorkspaces, selectActiveWorkspaceId, selectProjects, selectSelectedProjectId, selectTeams } from '../store';

export function Breadcrumbs() {
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const projects = useStore(selectProjects);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const teams = useStore(selectTeams);

  const segments = useMemo<string[]>(() => {
    const result: string[] = [];
    const workspace = workspaces.find(w => w.id === activeWorkspaceId);
    const project = projects.find(p => p.id === selectedProjectId);
    const team = project?.teamId ? teams.find(t => t.id === project.teamId) : null;

    if (workspace) result.push(workspace.name);
    if (team) result.push(team.name);
    if (project) result.push(project.name);

    return result;
  }, [workspaces, activeWorkspaceId, projects, selectedProjectId, teams]);

  if (segments.length === 0) return null;

  return (
    <div className="flex items-center text-caption-lg text-text-tertiary min-w-0">
      {segments.map((label, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <ChevronRight size={ICON_SIZE.xs} className="text-text-quaternary shrink-0 mx-2" />
          )}
          <span className={i === segments.length - 1 ? 'truncate min-w-0' : 'shrink-0'}>{label}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

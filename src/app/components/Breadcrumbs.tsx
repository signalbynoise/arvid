import React, { useMemo } from 'react';
import { ChevronRight, Network, Folder } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectWorkspaces, selectActiveWorkspaceId, selectProjects, selectSelectedProjectId, selectTeams } from '../store';

interface Segment {
  icon?: React.ReactNode;
  label: string;
}

export function Breadcrumbs() {
  const workspaces = useStore(selectWorkspaces);
  const activeWorkspaceId = useStore(selectActiveWorkspaceId);
  const projects = useStore(selectProjects);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const teams = useStore(selectTeams);

  const segments = useMemo<Segment[]>(() => {
    const result: Segment[] = [];
    const workspace = workspaces.find(w => w.id === activeWorkspaceId);
    const project = projects.find(p => p.id === selectedProjectId);
    const team = project?.teamId ? teams.find(t => t.id === project.teamId) : null;

    if (workspace) result.push({ label: workspace.name });
    if (team) result.push({ icon: <Network size={ICON_SIZE.sm} className="text-text-quaternary shrink-0" />, label: team.name });
    if (project) result.push({ icon: <Folder size={ICON_SIZE.sm} className="text-text-quaternary shrink-0" />, label: project.name });

    return result;
  }, [workspaces, activeWorkspaceId, projects, selectedProjectId, teams]);

  if (segments.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-caption-lg text-text-tertiary min-w-0">
      {segments.map((segment, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={ICON_SIZE.sm} className="text-text-quaternary shrink-0" />}
          <div className={`flex items-center gap-1 ${i === segments.length - 1 ? 'min-w-0' : 'shrink-0'}`}>
            {segment.icon}
            <span className={i === segments.length - 1 ? 'truncate' : ''}>{segment.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

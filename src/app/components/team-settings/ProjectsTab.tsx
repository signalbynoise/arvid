import React from 'react';
import { Folder } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import type { Project } from '../../types';

interface ProjectsTabProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

export function ProjectsTab({ projects, onSelectProject }: ProjectsTabProps) {
  return (
    <div className="p-5 space-y-4">
      <span className="text-label-upper text-text-tertiary">
        Projects ({projects.length})
      </span>

      <div className="space-y-1">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="w-full flex items-center gap-3 p-3 rounded-card bg-surface-frost-02 border border-border-default hover:bg-surface-frost-04 transition-colors text-left"
          >
            <Folder size={ICON_SIZE.sm} className="text-text-quaternary shrink-0" />
            <span className="text-caption-lg text-text-primary truncate">
              {project.name}
            </span>
          </button>
        ))}

        {projects.length === 0 && (
          <p className="text-caption-lg text-text-empty text-center py-6">
            No projects in this team.
          </p>
        )}
      </div>
    </div>
  );
}

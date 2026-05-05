import React, { useEffect, useState } from 'react';
import { Loader2, ChevronDown, ChevronLeft } from 'lucide-react';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('LinearProjectSelector');

interface LinearProjectSelectorProps {
  projectId: string;
  onLinked?: () => void;
}

export function LinearProjectSelector({ projectId, onLinked }: LinearProjectSelectorProps) {
  const linearTeams = useStore(s => s.linearTeams);
  const linearProjects = useStore(s => s.linearProjects);
  const loadLinearTeams = useStore(s => s.loadLinearTeams);
  const loadLinearProjects = useStore(s => s.loadLinearProjects);
  const linkLinearProject = useStore(s => s.linkLinearProject);

  const [isOpen, setIsOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && linearTeams.length === 0) {
      setIsLoading(true);
      loadLinearTeams().finally(() => setIsLoading(false));
    }
  }, [isOpen, linearTeams.length, loadLinearTeams]);

  const handleSelectTeam = async (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsLoading(true);
    await loadLinearProjects(teamId);
    setIsLoading(false);
  };

  const handleSelectProject = async (linearProjectId: string, linearProjectName: string) => {
    if (!selectedTeamId) return;
    setIsLinking(true);
    log.info('select', 'Linking Linear project', { projectId, linearProjectId });

    try {
      await linkLinearProject(projectId, linearProjectId, linearProjectName, selectedTeamId);
      setIsOpen(false);
      setSelectedTeamId(null);
      onLinked?.();
    } catch (err) {
      log.error('select', 'Failed to link project', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleBack = () => {
    setSelectedTeamId(null);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLinking}
        className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-secondary bg-surface-frost-02 hover:bg-surface-frost-06 border border-border-default rounded-comfortable transition-colors disabled:opacity-50"
      >
        <img src="/linear.svg" alt="" className="w-4 h-4 shrink-0 opacity-60" />
        <span className="truncate">
          {isLinking ? 'Linking...' : 'Select a Linear project'}
        </span>
        <ChevronDown size={12} className="shrink-0 ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 z-50 max-h-[280px] min-w-[240px] w-max overflow-y-auto bg-surface-panel border border-border-default rounded-comfortable shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-text-quaternary" />
            </div>
          ) : selectedTeamId === null ? (
            linearTeams.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-text-quaternary">
                No teams found.
              </div>
            ) : (
              <div className="py-1">
                <div className="px-3 py-1.5 text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wider">
                  Select team
                </div>
                {linearTeams.map(team => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleSelectTeam(team.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] text-text-secondary hover:bg-surface-frost-06 transition-colors"
                  >
                    <span className="font-mono text-[10px] text-text-quaternary shrink-0">{team.key}</span>
                    <span className="font-[var(--fw-medium)]">{team.name}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="py-1">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[11px] text-text-tertiary hover:text-text-primary transition-colors"
              >
                <ChevronLeft size={12} />
                <span>Back to teams</span>
              </button>
              <div className="px-3 py-1.5 text-[10px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wider">
                Select project
              </div>
              {linearProjects.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12px] text-text-quaternary">
                  No projects found in this team.
                </div>
              ) : (
                linearProjects.map(proj => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleSelectProject(proj.id, proj.name)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] text-text-secondary hover:bg-surface-frost-06 transition-colors font-[var(--fw-medium)]"
                  >
                    {proj.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

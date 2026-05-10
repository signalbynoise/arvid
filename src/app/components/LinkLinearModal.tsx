import React, { useEffect, useState } from 'react';
import { LoaderPinwheel, ChevronLeft } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { useStore } from '../store';
import { useLinkIntegration } from '../machines/mutations/useLinkIntegration';

interface LinkLinearModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onLinked: () => void;
}

export function LinkLinearModal({ isOpen, onClose, projectId, onLinked }: LinkLinearModalProps) {
  const linearTeams = useStore(s => s.linearTeams);
  const linearProjects = useStore(s => s.linearProjects);
  const loadLinearTeams = useStore(s => s.loadLinearTeams);
  const loadLinearProjects = useStore(s => s.loadLinearProjects);
  const linkLinearProject = useStore(s => s.linkLinearProject);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { error, isLinking, link } = useLinkIntegration({
    integrationType: 'linear',
    link: async (payload) => {
      await linkLinearProject(
        projectId,
        payload.linearProjectId as string,
        payload.linearProjectName as string,
        payload.teamId as string,
      );
    },
    onLinked,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedTeamId(null);
      setIsLoading(true);
      loadLinearTeams().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadLinearTeams]);

  const handleSelectTeam = async (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsLoading(true);
    await loadLinearProjects(teamId);
    setIsLoading(false);
  };

  const handleSelectProject = (linearProjectId: string, linearProjectName: string) => {
    if (!selectedTeamId) return;
    link({ linearProjectId, linearProjectName, teamId: selectedTeamId });
  };

  const title = selectedTeamId ? 'Select Project' : 'Select Team';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderPinwheel size={ICON_SIZE.lg} className="animate-spin text-text-quaternary" />
        </div>
      ) : selectedTeamId === null ? (
        linearTeams.length === 0 ? (
          <p className="text-[13px] text-text-quaternary text-center py-8">No teams found.</p>
        ) : (
          <div className="max-h-[320px] overflow-y-auto hide-scrollbar space-y-0.5">
            {linearTeams.map(team => (
              <button
                key={team.id}
                type="button"
                onClick={() => handleSelectTeam(team.id)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-comfortable text-left transition-colors hover:bg-surface-frost-04"
              >
                <span className="text-[13px] text-text-secondary">{team.name}</span>
                <span className="font-mono text-[12px] text-text-quaternary">{team.key}</span>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="max-h-[320px] overflow-y-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTeamId(null)}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-text-quaternary hover:text-text-secondary transition-colors"
          >
            <ChevronLeft size={ICON_SIZE.sm} />
            <span>Back to teams</span>
          </button>
          {error && <p className="text-[13px] text-status-error px-3">{error}</p>}
          <div className="space-y-0.5 mt-1">
            {linearProjects.length === 0 ? (
              <p className="text-[13px] text-text-quaternary text-center py-6">No projects in this team.</p>
            ) : (
              linearProjects.map(proj => (
                <button
                  key={proj.id}
                  type="button"
                  disabled={isLinking}
                  onClick={() => handleSelectProject(proj.id, proj.name)}
                  className="flex items-center w-full px-3 py-2.5 rounded-comfortable text-left transition-colors hover:bg-surface-frost-04 disabled:opacity-50"
                >
                  <span className="text-[13px] text-text-secondary">{proj.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </BaseModal>
  );
}

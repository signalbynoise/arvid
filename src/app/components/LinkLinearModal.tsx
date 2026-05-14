import React, { useEffect, useState } from 'react';
import { LoaderPinwheel, ChevronLeft } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { PickerList, PickerItem } from './ui/PickerList';
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
          <p className="text-caption-lg text-text-quaternary text-center py-8">No teams found.</p>
        ) : (
          <PickerList>
            {linearTeams.map(team => (
              <PickerItem
                key={team.id}
                label={team.name}
                right={<span className="font-mono text-label text-text-quaternary">{team.key}</span>}
                onClick={() => handleSelectTeam(team.id)}
              />
            ))}
          </PickerList>
        )
      ) : (
        <PickerList>
          <button
            type="button"
            onClick={() => setSelectedTeamId(null)}
            className="flex items-center gap-2 w-full px-3 py-2 text-caption-lg text-text-quaternary hover:text-text-secondary transition-colors"
          >
            <ChevronLeft size={ICON_SIZE.sm} />
            <span>Back to teams</span>
          </button>
          {error && <p className="text-caption-lg text-status-error px-3">{error}</p>}
          <div className="space-y-0.5 mt-1">
            {linearProjects.length === 0 ? (
              <p className="text-caption-lg text-text-quaternary text-center py-6">No projects in this team.</p>
            ) : (
              linearProjects.map(proj => (
                <PickerItem
                  key={proj.id}
                  label={proj.name}
                  disabled={isLinking}
                  onClick={() => handleSelectProject(proj.id, proj.name)}
                />
              ))
            )}
          </div>
        </PickerList>
      )}
    </BaseModal>
  );
}

import React, { useEffect, useState } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { FooterDropdownTrigger } from './FooterDropdownTrigger';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
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
      <FooterDropdownTrigger onClick={() => setIsOpen(!isOpen)} disabled={isLinking} isOpen={isOpen}>
        <span className="text-text-tertiary">{isLinking ? 'Linking...' : 'Select project'}</span>
      </FooterDropdownTrigger>

      <DropdownPanel isOpen={isOpen} variant="attached" position="above">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={ICON_SIZE.md} className="animate-spin text-text-quaternary" />
          </div>
        ) : selectedTeamId === null ? (
          linearTeams.length === 0 ? (
            <div className="px-3 py-4 text-center text-text-quaternary">
              No teams found.
            </div>
          ) : (
            <DropdownSection label="SELECT TEAM">
              {linearTeams.map(team => (
                <DropdownItem
                  key={team.id}
                  right={<span className="font-mono text-text-quaternary">{team.key}</span>}
                  label={team.name}
                  onClick={() => handleSelectTeam(team.id)}
                />
              ))}
            </DropdownSection>
          )
        ) : (
          <>
            <DropdownItem
              icon={<ChevronLeft size={ICON_SIZE.md} />}
              label="Back to teams"
              variant="muted"
              onClick={handleBack}
            />
            <DropdownSection label="SELECT PROJECT">
              {linearProjects.length === 0 ? (
                <div className="px-3 py-4 text-center text-text-quaternary">
                  No projects found in this team.
                </div>
              ) : (
                linearProjects.map(proj => (
                  <DropdownItem
                    key={proj.id}
                    label={proj.name}
                    onClick={() => handleSelectProject(proj.id, proj.name)}
                  />
                ))
              )}
            </DropdownSection>
          </>
        )}
      </DropdownPanel>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, Lock, Globe } from 'lucide-react';
import { FooterDropdownTrigger } from './FooterDropdownTrigger';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { DropdownDivider } from './ui/DropdownDivider';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('RepoSelector');

interface RepoSelectorProps {
  projectId: string;
  onLinked?: () => void;
}

export function RepoSelector({ projectId, onLinked }: RepoSelectorProps) {
  const githubRepos = useStore(s => s.githubRepos);
  const loadGitHubRepos = useStore(s => s.loadGitHubRepos);
  const linkRepoToProject = useStore(s => s.linkRepoToProject);
  const fetchRepoContext = useStore(s => s.fetchRepoContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const publicRepos = useMemo(() => githubRepos.filter(r => !r.isPrivate), [githubRepos]);
  const privateRepos = useMemo(() => githubRepos.filter(r => r.isPrivate), [githubRepos]);

  useEffect(() => {
    if (isOpen && githubRepos.length === 0) {
      setIsLoading(true);
      loadGitHubRepos().finally(() => setIsLoading(false));
    }
  }, [isOpen, githubRepos.length, loadGitHubRepos]);

  const handleSelect = async (repoFullName: string, defaultBranch: string) => {
    setIsLinking(true);
    log.info('select', 'Linking repository', { projectId, repoFullName });

    try {
      await linkRepoToProject(projectId, repoFullName, defaultBranch);
      setIsOpen(false);
      fetchRepoContext(projectId);
      onLinked?.();
    } catch (err) {
      log.error('select', 'Failed to link repository', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="relative">
      <FooterDropdownTrigger onClick={() => setIsOpen(!isOpen)} disabled={isLinking} isOpen={isOpen}>
        <span className="text-text-tertiary">{isLinking ? 'Linking...' : 'Select repository'}</span>
      </FooterDropdownTrigger>

      <DropdownPanel isOpen={isOpen} variant="attached" position="above">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-text-quaternary" />
          </div>
        ) : githubRepos.length === 0 ? (
          <div className="px-3 py-4 text-center text-text-quaternary">
            No repositories found.
          </div>
        ) : (
          <>
            {publicRepos.length > 0 && (
              <DropdownSection label="PUBLIC">
                {publicRepos.map(repo => (
                  <DropdownItem
                    key={repo.id}
                    icon={<Globe size={16} />}
                    label={repo.fullName}
                    onClick={() => handleSelect(repo.fullName, repo.defaultBranch)}
                  />
                ))}
              </DropdownSection>
            )}
            {publicRepos.length > 0 && privateRepos.length > 0 && (
              <DropdownDivider />
            )}
            {privateRepos.length > 0 && (
              <DropdownSection label="PRIVATE">
                {privateRepos.map(repo => (
                  <DropdownItem
                    key={repo.id}
                    icon={<Lock size={16} />}
                    label={repo.fullName}
                    onClick={() => handleSelect(repo.fullName, repo.defaultBranch)}
                  />
                ))}
              </DropdownSection>
            )}
          </>
        )}
      </DropdownPanel>
    </div>
  );
}

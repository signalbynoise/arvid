import React, { useEffect, useState, useMemo } from 'react';
import { LoaderPinwheel, Globe, Lock } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { PickerList, PickerSection, PickerItem } from './ui/PickerList';
import { useStore } from '../store';
import { useLinkIntegration } from '../machines/mutations/useLinkIntegration';

interface LinkRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onLinked: () => void;
}

export function LinkRepoModal({ isOpen, onClose, projectId, onLinked }: LinkRepoModalProps) {
  const githubRepos = useStore(s => s.githubRepos);
  const loadGitHubRepos = useStore(s => s.loadGitHubRepos);
  const linkRepoToProject = useStore(s => s.linkRepoToProject);
  const fetchRepoContext = useStore(s => s.fetchRepoContext);

  const { error, isLinking, link } = useLinkIntegration({
    integrationType: 'github',
    link: async (payload) => {
      await linkRepoToProject(projectId, payload.repoFullName as string, payload.defaultBranch as string);
      fetchRepoContext(projectId);
    },
    onLinked,
    onClose,
  });

  const [isLoading, setIsLoading] = useState(false);

  const publicRepos = useMemo(() => githubRepos.filter(r => !r.isPrivate), [githubRepos]);
  const privateRepos = useMemo(() => githubRepos.filter(r => r.isPrivate), [githubRepos]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadGitHubRepos().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadGitHubRepos]);

  const handleSelect = (repoFullName: string, defaultBranch: string) => {
    link({ repoFullName, defaultBranch });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Link Repository" size="sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderPinwheel size={ICON_SIZE.lg} className="animate-spin text-text-quaternary" />
        </div>
      ) : githubRepos.length === 0 ? (
        <p className="text-caption-lg text-text-quaternary text-center py-8">No repositories found.</p>
      ) : (
        <PickerList>
          {error && <p className="text-caption-lg text-status-error px-3">{error}</p>}
          {publicRepos.length > 0 && (
            <PickerSection label="Public">
              {publicRepos.map(repo => (
                <PickerItem
                  key={repo.id}
                  icon={<Globe size={ICON_SIZE.md} />}
                  label={repo.fullName}
                  disabled={isLinking}
                  onClick={() => handleSelect(repo.fullName, repo.defaultBranch)}
                />
              ))}
            </PickerSection>
          )}
          {privateRepos.length > 0 && (
            <PickerSection label="Private">
              {privateRepos.map(repo => (
                <PickerItem
                  key={repo.id}
                  icon={<Lock size={ICON_SIZE.md} />}
                  label={repo.fullName}
                  disabled={isLinking}
                  onClick={() => handleSelect(repo.fullName, repo.defaultBranch)}
                />
              ))}
            </PickerSection>
          )}
        </PickerList>
      )}
    </BaseModal>
  );
}

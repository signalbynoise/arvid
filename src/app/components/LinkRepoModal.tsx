import React, { useEffect, useState, useMemo } from 'react';
import { LoaderPinwheel, Globe, Lock } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('LinkRepoModal');

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

  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const publicRepos = useMemo(() => githubRepos.filter(r => !r.isPrivate), [githubRepos]);
  const privateRepos = useMemo(() => githubRepos.filter(r => r.isPrivate), [githubRepos]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadGitHubRepos().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadGitHubRepos]);

  const handleSelect = async (repoFullName: string, defaultBranch: string) => {
    setIsLinking(true);
    log.info('select', 'Linking repository', { projectId, repoFullName });

    try {
      await linkRepoToProject(projectId, repoFullName, defaultBranch);
      fetchRepoContext(projectId);
      onLinked();
      onClose();
    } catch (err) {
      log.error('select', 'Failed to link repository', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const renderRepoItem = (repo: typeof githubRepos[number]) => (
    <button
      key={repo.id}
      type="button"
      disabled={isLinking}
      onClick={() => handleSelect(repo.fullName, repo.defaultBranch)}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-comfortable text-left transition-colors hover:bg-surface-frost-04 disabled:opacity-50"
    >
      <span className="shrink-0 text-text-quaternary">
        {repo.isPrivate ? <Lock size={ICON_SIZE.md} /> : <Globe size={ICON_SIZE.md} />}
      </span>
      <span className="text-[13px] text-text-secondary truncate">{repo.fullName}</span>
    </button>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Link Repository" size="sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderPinwheel size={ICON_SIZE.lg} className="animate-spin text-text-quaternary" />
        </div>
      ) : githubRepos.length === 0 ? (
        <p className="text-[13px] text-text-quaternary text-center py-8">No repositories found.</p>
      ) : (
        <div className="max-h-[320px] overflow-y-auto hide-scrollbar space-y-4">
          {publicRepos.length > 0 && (
            <div>
              <p className="text-label-upper text-text-empty px-3 mb-1">Public</p>
              <div className="space-y-0.5">{publicRepos.map(renderRepoItem)}</div>
            </div>
          )}
          {privateRepos.length > 0 && (
            <div>
              <p className="text-label-upper text-text-empty px-3 mb-1">Private</p>
              <div className="space-y-0.5">{privateRepos.map(renderRepoItem)}</div>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
}

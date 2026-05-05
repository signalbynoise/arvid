import React, { useEffect, useState } from 'react';
import { GitBranch, Loader2, Lock, Globe, ChevronDown } from 'lucide-react';
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLinking}
        className="flex items-center gap-2 w-full px-3 py-2 text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-secondary bg-surface-frost-02 hover:bg-surface-frost-06 border border-border-default rounded-comfortable transition-colors disabled:opacity-50"
      >
        <GitBranch size={13} className="shrink-0" />
        <span className="truncate">
          {isLinking ? 'Linking...' : 'Select a repository'}
        </span>
        <ChevronDown size={12} className="shrink-0 ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 z-50 max-h-[280px] min-w-[300px] w-max overflow-y-auto bg-surface-panel border border-border-default rounded-comfortable shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-text-quaternary" />
            </div>
          ) : githubRepos.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-text-quaternary">
              No repositories found.
            </div>
          ) : (
            <div className="py-1">
              {githubRepos.map(repo => (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => handleSelect(repo.fullName, repo.defaultBranch)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] text-text-secondary hover:bg-surface-frost-06 transition-colors"
                >
                  {repo.isPrivate ? (
                    <Lock size={12} className="shrink-0 text-text-quaternary" />
                  ) : (
                    <Globe size={12} className="shrink-0 text-text-quaternary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-[var(--fw-medium)]">{repo.fullName}</div>
                    {repo.description && (
                      <div className="truncate text-[11px] text-text-quaternary mt-0.5">
                        {repo.description}
                      </div>
                    )}
                  </div>
                  {repo.language && (
                    <span className="shrink-0 text-[10px] text-text-quaternary px-1.5 py-0.5 bg-surface-frost-04 rounded-standard">
                      {repo.language}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

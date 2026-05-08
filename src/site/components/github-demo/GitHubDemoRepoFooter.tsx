import { Lock, Globe, ChevronDown } from 'lucide-react';
import { MiniSidebarFooterItem } from '../mini-demo';
import { REPOS } from './data';

interface GitHubDemoRepoFooterProps {
  visible: boolean;
  selectorOpen: boolean;
  repoSelected: boolean;
  fetching: boolean;
  fetchDone: boolean;
}

export function GitHubDemoRepoFooter({ visible, selectorOpen, repoSelected, fetching, fetchDone }: GitHubDemoRepoFooterProps) {
  return (
    <div className={`border-t border-border-subtle shrink-0 py-2 transition-all duration-500 ${
      visible ? 'opacity-100' : 'opacity-0'
    }`}>
      <MiniSidebarFooterItem
        icon="/github.svg"
        label="Repository"
        isConnected={fetchDone}
        value={repoSelected ? 'acme/web-app' : undefined}
        placeholder="Select a repository"
        loading={fetching && !fetchDone}
      >
        {!repoSelected && (
          <div className="relative">
            <div className={`flex items-center justify-between w-full px-1.5 py-1 bg-surface-panel border border-border-default rounded-[1px] transition-colors ${
              selectorOpen ? 'border-border-focus' : ''
            }`}>
              <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary truncate">Select a repository</span>
              <ChevronDown size={6} className="text-text-quaternary shrink-0 ml-1" />
            </div>

            {selectorOpen && (
              <div className="absolute bottom-full left-0 mb-0.5 z-10 w-[150px] bg-surface-panel border border-border-default rounded-[3px] shadow-elevated overflow-hidden">
                <div className="py-0.5">
                  <div className="px-2 py-0.5">
                    <span className="text-[5px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wide">Private</span>
                  </div>
                  {REPOS.filter(r => r.visibility === 'private').map((repo, i) => (
                    <div key={repo.name} className={`flex items-center gap-1 px-2 py-1 text-[7px] ${
                      i === 0 ? 'bg-surface-frost-05' : ''
                    }`}>
                      <Lock size={6} className="shrink-0 text-text-quaternary" />
                      <span className="font-[var(--fw-medium)] text-text-secondary truncate">{repo.name}</span>
                    </div>
                  ))}
                  <div className="border-t border-border-subtle my-0.5" />
                  <div className="px-2 py-0.5">
                    <span className="text-[5px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-wide">Public</span>
                  </div>
                  {REPOS.filter(r => r.visibility === 'public').map(repo => (
                    <div key={repo.name} className="flex items-center gap-1 px-2 py-1 text-[7px]">
                      <Globe size={6} className="shrink-0 text-text-quaternary" />
                      <span className="font-[var(--fw-medium)] text-text-secondary truncate">{repo.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {repoSelected && (
          <div className="flex items-center justify-between w-full px-1.5 py-1 bg-surface-panel border border-border-default rounded-[1px]">
            <span className="text-[6px] font-[var(--fw-medium)] text-text-primary truncate">acme/web-app</span>
            <ChevronDown size={6} className="text-text-quaternary shrink-0 ml-1" />
          </div>
        )}
      </MiniSidebarFooterItem>
    </div>
  );
}

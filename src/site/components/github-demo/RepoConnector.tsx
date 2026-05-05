import {
  Folder,
  Hash,
  Plus,
  ChevronDown,
  GitBranch,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { REPOS } from './data';

interface RepoConnectorProps {
  showRepoSection: boolean;
  openSelector: boolean;
  selectRepo: boolean;
  startFetching: boolean;
  fetchDone: boolean;
  showBranchIcon: boolean;
}

export function RepoConnector({
  showRepoSection,
  openSelector,
  selectRepo,
  startFetching,
  fetchDone,
  showBranchIcon,
}: RepoConnectorProps) {
  return (
    <div className="w-[160px] shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
      <div className="h-8 flex items-center px-3 border-b border-border-subtle shrink-0">
        <img src="/logo_wide.svg" alt="Arvid" className="h-3" />
      </div>

      <div className="flex-1 py-2 overflow-hidden">
        <div className="flex items-center justify-between px-3 mb-1.5">
          <span className="text-[8px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Projects</span>
          <Plus size={8} className="text-text-quaternary" />
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 text-[9px] rounded-sm mx-1 bg-surface-frost-08 text-text-primary">
          <ChevronDown size={8} className="shrink-0" />
          <Folder size={9} className="shrink-0 text-text-quaternary" />
          <span className="truncate font-[var(--fw-medium)]">Arvid</span>
          <GitBranch size={8} className={`shrink-0 transition-all duration-500 ${
            showBranchIcon ? 'text-green-500 opacity-70' : 'opacity-0'
          }`} />
        </div>

        <div className="ml-4">
          <div className="flex items-center space-x-1.5 px-3 py-0.5 text-[8px] text-text-tertiary">
            <Hash size={8} className="shrink-0 text-text-quaternary" />
            <span className="truncate">Commerce Co...</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 text-[9px] rounded-sm mx-1 text-text-tertiary">
          <Folder size={9} className="shrink-0 text-text-quaternary" />
          <span className="truncate font-[var(--fw-medium)]">Design System</span>
        </div>
      </div>

      <div className={`border-t border-border-subtle px-3 py-2.5 shrink-0 transition-all duration-500 ${
        showRepoSection ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="flex items-center gap-1.5 mb-2">
          <GitBranch size={9} className="text-text-quaternary" />
          <span className="text-[7px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Repository</span>
          {startFetching && !fetchDone && (
            <Loader2 size={8} className="animate-spin text-text-quaternary ml-auto" />
          )}
          {fetchDone && (
            <CheckCircle2 size={8} className="text-green-500 ml-auto" />
          )}
        </div>

        {selectRepo ? (
          <div className="text-[9px] text-text-secondary truncate transition-all duration-300 opacity-100">
            acme/web-app
          </div>
        ) : (
          <div className="relative">
            <div className={`flex items-center gap-1.5 w-full px-2 py-1.5 text-[8px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-02 border border-border-subtle rounded-comfortable transition-colors ${
              openSelector ? 'bg-surface-frost-06' : ''
            }`}>
              <GitBranch size={8} className="shrink-0" />
              <span className="truncate">Select a repository</span>
              <ChevronDown size={7} className="shrink-0 ml-auto" />
            </div>

            {openSelector && !selectRepo && (
              <div className="absolute bottom-full left-0 mb-1 z-10 w-[200px] bg-surface-panel border border-border-subtle rounded-comfortable shadow-elevated overflow-hidden">
                <div className="py-0.5">
                  {REPOS.map((repo, i) => (
                    <div key={repo.name} className={`flex items-center gap-1.5 px-2 py-1.5 text-[8px] transition-colors ${
                      i === 0 ? 'bg-surface-frost-06' : ''
                    }`}>
                      {repo.isPrivate ? (
                        <Lock size={7} className="shrink-0 text-text-quaternary" />
                      ) : (
                        <Globe size={7} className="shrink-0 text-text-quaternary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-[var(--fw-medium)] text-text-secondary">{repo.name}</div>
                        <div className="text-[7px] text-text-quaternary truncate">{repo.desc}</div>
                      </div>
                      <span className="shrink-0 text-[6px] text-text-quaternary px-1 py-0.5 bg-surface-frost-04 rounded-sm">
                        {repo.lang}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

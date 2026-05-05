import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  User,
  PanelLeft,
  Check,
  X,
  LoaderPinwheel,
  CheckCircle,
  CircleDashed,
} from 'lucide-react';

interface TimelineStep {
  at: number;
  action: string;
}

const TIMELINE: TimelineStep[] = [
  { at: 0, action: 'show_shell' },
  { at: 800, action: 'show_repo_section' },
  { at: 1600, action: 'open_selector' },
  { at: 3200, action: 'select_repo' },
  { at: 3800, action: 'start_fetching' },
  { at: 5400, action: 'fetch_done' },
  { at: 5800, action: 'show_branch_icon' },
  { at: 6400, action: 'show_req_1' },
  { at: 6800, action: 'show_req_2' },
  { at: 7400, action: 'select_req' },
  { at: 8000, action: 'show_context_badge' },
  { at: 8400, action: 'suggest_q1' },
  { at: 9000, action: 'suggest_q2' },
  { at: 9600, action: 'accept_q1' },
  { at: 10200, action: 'suggest_q3' },
  { at: 10800, action: 'accept_q2' },
  { at: 13500, action: 'reset' },
];

const LOOP_DURATION = 14000;

const REPOS = [
  { name: 'acme/web-app', desc: 'Main product frontend', lang: 'TypeScript', isPrivate: true },
  { name: 'acme/api-server', desc: 'REST + GraphQL backend', lang: 'Go', isPrivate: true },
  { name: 'acme/design-system', desc: 'Shared component library', lang: 'TypeScript', isPrivate: false },
];

function useTimeline(steps: TimelineStep[], loopMs: number) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const runCycle = useCallback(() => {
    setCompleted(new Set());
    timersRef.current = [];
    for (const step of steps) {
      if (step.action === 'reset') continue;
      const t = setTimeout(() => {
        setCompleted(prev => new Set(prev).add(step.action));
      }, step.at);
      timersRef.current.push(t);
    }
  }, [steps]);

  useEffect(() => {
    runCycle();
    const loop = setInterval(runCycle, loopMs);
    return () => {
      clearInterval(loop);
      timersRef.current.forEach(clearTimeout);
    };
  }, [runCycle, loopMs]);

  return completed;
}

export function GitHubDemo() {
  const s = useTimeline(TIMELINE, LOOP_DURATION);

  const showShell = s.has('show_shell');
  const showRepoSection = s.has('show_repo_section');
  const openSelector = s.has('open_selector');
  const selectRepo = s.has('select_repo');
  const startFetching = s.has('start_fetching');
  const fetchDone = s.has('fetch_done');
  const showBranchIcon = s.has('show_branch_icon');
  const showReq1 = s.has('show_req_1');
  const showReq2 = s.has('show_req_2');
  const selectReq = s.has('select_req');
  const showContextBadge = s.has('show_context_badge');
  const suggestQ1 = s.has('suggest_q1');
  const suggestQ2 = s.has('suggest_q2');
  const suggestQ3 = s.has('suggest_q3');
  const acceptQ1 = s.has('accept_q1');
  const acceptQ2 = s.has('accept_q2');

  return (
    <div className={`w-full h-full flex items-center justify-center bg-surface-frost-10 transition-all duration-700 ${
      showShell ? 'opacity-100' : 'opacity-0'
    }`}>
    <div className="w-[92%] h-[90%] flex rounded-lg overflow-hidden border border-border-subtle bg-surface-base shadow-elevated">
      {/* Sidebar */}
      <div className="w-[160px] shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
        <div className="h-8 flex items-center px-3 border-b border-border-subtle shrink-0">
          <img src="/logo_wide.svg" alt="Arvid" className="h-3" />
        </div>

        <div className="flex-1 py-2 overflow-hidden">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[8px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Projects</span>
            <Plus size={8} className="text-text-quaternary" />
          </div>

          {/* Project: Arvid */}
          <div className="flex items-center space-x-1.5 px-3 py-1 text-[9px] rounded-sm mx-1 bg-surface-frost-08 text-text-primary">
            <ChevronDown size={8} className="shrink-0" />
            <Folder size={9} className="shrink-0 text-text-quaternary" />
            <span className="truncate font-[var(--fw-medium)]">Arvid</span>
            <GitBranch size={8} className={`shrink-0 transition-all duration-500 ${
              showBranchIcon ? 'text-green-500 opacity-70' : 'opacity-0'
            }`} />
          </div>

          {/* Sub-project */}
          <div className="ml-4">
            <div className="flex items-center space-x-1.5 px-3 py-0.5 text-[8px] text-text-tertiary">
              <Hash size={8} className="shrink-0 text-text-quaternary" />
              <span className="truncate">Commerce Co...</span>
            </div>
          </div>

          {/* Other projects */}
          <div className="flex items-center space-x-1.5 px-3 py-1 text-[9px] rounded-sm mx-1 text-text-tertiary">
            <Folder size={9} className="shrink-0 text-text-quaternary" />
            <span className="truncate font-[var(--fw-medium)]">Design System</span>
          </div>
        </div>

        {/* Repository section at bottom */}
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
            <div className={`text-[9px] text-text-secondary truncate transition-all duration-300 ${
              selectRepo ? 'opacity-100' : 'opacity-0'
            }`}>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-8 border-b border-border-subtle flex items-center px-3 bg-surface-panel shrink-0">
          <PanelLeft size={10} className="text-text-tertiary" />
          <div className="ml-auto flex items-center space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-surface-frost-08 border border-border-subtle" />
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Requirements Column */}
          <div className="w-1/2 shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
            <div className="p-2 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">1. Requirements</span>
              <Plus size={8} className="text-text-quaternary" />
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {/* Req 1 */}
              <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
                showReq1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              } ${selectReq ? 'bg-surface-frost-05' : 'bg-surface-frost-02'}`}>
                {showContextBadge && (
                  <div className={`flex items-center gap-1 mb-1.5 transition-all duration-400 ${
                    showContextBadge ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <GitBranch size={7} className="text-green-500" />
                    <span className="text-[6px] font-[var(--fw-medium)] text-green-500/70">Enhanced with repo context</span>
                  </div>
                )}
                <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight mb-1.5">
                  Post-Login OAuth Profile Refresh
                </h4>
                <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
                  <User size={8} className="opacity-70" />
                  <span>Erik L.</span>
                </div>
                <div className="flex items-center justify-between text-[7px]">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-8 h-1 bg-surface-frost-10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-status-warning" style={{ width: '55%' }} />
                    </div>
                    <span className="text-text-secondary font-[var(--fw-medium)]">55%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  </div>
                </div>
              </div>

              {/* Req 2 */}
              <div className={`p-2.5 rounded-md border border-border-subtle bg-surface-frost-02 transition-all duration-500 ${
                showReq2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              } ${selectReq ? 'opacity-30' : ''}`}>
                <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight mb-1.5">
                  GitHub OAuth &amp; Repository Analysis
                </h4>
                <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
                  <User size={8} className="opacity-70" />
                  <span>Erik L.</span>
                </div>
                <div className="flex items-center justify-between text-[7px]">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-8 h-1 bg-surface-frost-10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-status-success" style={{ width: '100%' }} />
                    </div>
                    <span className="text-text-secondary font-[var(--fw-medium)]">100%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions Column */}
          <div className="w-1/2 shrink-0 flex flex-col bg-surface-panel">
            <div className="p-2 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">2. Questions</span>
              {suggestQ1 && <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" />}
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {selectReq ? (
                <>
                  {/* Q1 — suggestion then accepted */}
                  {suggestQ1 && (
                    acceptQ1 ? (
                      <div className="p-2.5 rounded-md border border-border-subtle bg-surface-frost-02 transition-all duration-500 opacity-100">
                        <h4 className="text-[9px] font-[var(--fw-regular)] text-text-primary leading-snug mb-2">
                          How should the system detect a 'successful login' to trigger the refresh—via a session flag, or event?
                        </h4>
                        <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
                          <LoaderPinwheel size={8} className="opacity-70" />
                          <span>Arvid</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-sm border text-[7px] font-[var(--fw-medium)] text-status-error bg-status-error-surface border-status-error-border">
                            <CircleDashed size={7} />
                            <span>Unanswered</span>
                          </div>
                          <span className="text-[7px] text-text-quaternary uppercase tracking-wider font-[var(--fw-medium)]">Auth</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-md border border-dashed border-border-strong bg-surface-frost-01 opacity-70 transition-all duration-500">
                        <div className="flex items-center mb-1.5">
                          <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1 py-0.5 rounded-sm uppercase tracking-wider border border-border-subtle">AI Suggestion</span>
                        </div>
                        <h4 className="text-[9px] font-[var(--fw-regular)] text-text-tertiary leading-snug mb-2">
                          How should the system detect a 'successful login' to trigger the refresh?
                        </h4>
                        <div className="flex items-center space-x-1.5">
                          <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-08 text-text-primary rounded-sm text-[7px] font-[var(--fw-medium)]">
                            <Check size={6} />
                            <span>Use</span>
                          </div>
                          <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-05 text-text-tertiary rounded-sm text-[7px] font-[var(--fw-medium)]">
                            <X size={6} />
                            <span>Hide</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* Q2 — suggestion then accepted */}
                  {suggestQ2 && (
                    acceptQ2 ? (
                      <div className="p-2.5 rounded-md border border-border-subtle bg-surface-frost-02 transition-all duration-500 opacity-100">
                        <h4 className="text-[9px] font-[var(--fw-regular)] text-text-primary leading-snug mb-2">
                          What specific profile fields from GitHub or Google should be synced to the Supabase users table?
                        </h4>
                        <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
                          <LoaderPinwheel size={8} className="opacity-70" />
                          <span>Arvid</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-sm border text-[7px] font-[var(--fw-medium)] text-status-error bg-status-error-surface border-status-error-border">
                            <CircleDashed size={7} />
                            <span>Unanswered</span>
                          </div>
                          <span className="text-[7px] text-text-quaternary uppercase tracking-wider font-[var(--fw-medium)]">Data</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-md border border-dashed border-border-strong bg-surface-frost-01 opacity-70 transition-all duration-500">
                        <div className="flex items-center mb-1.5">
                          <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1 py-0.5 rounded-sm uppercase tracking-wider border border-border-subtle">AI Suggestion</span>
                        </div>
                        <h4 className="text-[9px] font-[var(--fw-regular)] text-text-tertiary leading-snug mb-2">
                          What profile fields from GitHub/Google should be synced to Supabase?
                        </h4>
                        <div className="flex items-center space-x-1.5">
                          <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-08 text-text-primary rounded-sm text-[7px] font-[var(--fw-medium)]">
                            <Check size={6} />
                            <span>Use</span>
                          </div>
                          <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-05 text-text-tertiary rounded-sm text-[7px] font-[var(--fw-medium)]">
                            <X size={6} />
                            <span>Hide</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* Q3 — always suggestion */}
                  {suggestQ3 && (
                    <div className="p-2.5 rounded-md border border-dashed border-border-strong bg-surface-frost-01 opacity-70 transition-all duration-500">
                      <div className="flex items-center mb-1.5">
                        <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1 py-0.5 rounded-sm uppercase tracking-wider border border-border-subtle">AI Suggestion</span>
                      </div>
                      <h4 className="text-[9px] font-[var(--fw-regular)] text-text-tertiary leading-snug mb-2">
                        How does the system determine which provider (GitHub or Google) to query for profile data?
                      </h4>
                      <div className="flex items-center space-x-1.5">
                        <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-08 text-text-primary rounded-sm text-[7px] font-[var(--fw-medium)]">
                          <Check size={6} />
                          <span>Use</span>
                        </div>
                        <div className="flex-1 py-1 flex items-center justify-center space-x-1 bg-surface-frost-05 text-text-tertiary rounded-sm text-[7px] font-[var(--fw-medium)]">
                          <X size={6} />
                          <span>Hide</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center h-full">
                  <p className="text-[8px] text-text-quaternary">Select a requirement</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

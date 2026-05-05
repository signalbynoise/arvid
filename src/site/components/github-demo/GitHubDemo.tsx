import { PanelLeft } from 'lucide-react';
import { useSequence } from '../app-demo/useSequence';
import { SEQUENCE } from './data';
import { RepoConnector } from './RepoConnector';
import { EnhancedRequirements } from './EnhancedRequirements';
import { SuggestedQuestions } from './SuggestedQuestions';

export function GitHubDemo() {
  const s = useSequence(SEQUENCE);

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
        <RepoConnector
          showRepoSection={showRepoSection}
          openSelector={openSelector}
          selectRepo={selectRepo}
          startFetching={startFetching}
          fetchDone={fetchDone}
          showBranchIcon={showBranchIcon}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-8 border-b border-border-subtle flex items-center px-3 bg-surface-panel shrink-0">
            <PanelLeft size={10} className="text-text-tertiary" />
            <div className="ml-auto flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded-full bg-surface-frost-08 border border-border-subtle" />
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <EnhancedRequirements
              showReq1={showReq1}
              showReq2={showReq2}
              selectReq={selectReq}
              showContextBadge={showContextBadge}
            />
            <SuggestedQuestions
              selectReq={selectReq}
              suggestQ1={suggestQ1}
              suggestQ2={suggestQ2}
              suggestQ3={suggestQ3}
              acceptQ1={acceptQ1}
              acceptQ2={acceptQ2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

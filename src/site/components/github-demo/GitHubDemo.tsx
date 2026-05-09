import { useRef } from 'react';
import { Plus, LoaderPinwheel, Folder } from 'lucide-react';
import { MiniShell, MiniTopbar, MiniColumn, MiniColumnEmpty, MiniSidebar, useSequence } from '../mini-demo';
import { RequirementCard } from '../app-demo/RequirementCard';
import { QuestionCard } from '../app-demo/QuestionCard';
import { GitHubDemoRepoFooter } from './GitHubDemoRepoFooter';
import { WORKSPACE_NAME, TEAMS, REQUIREMENTS, QUESTIONS, SEQUENCE } from './data';

const BREADCRUMBS = [
  { label: WORKSPACE_NAME },
  { label: 'Engineering', icon: Folder },
  { label: 'Arvid', icon: Folder },
];

export function GitHubDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const s = useSequence(SEQUENCE, containerRef);

  const showShell = s.has('show_shell');
  const expandProject = s.has('expand_project');
  const showFooter = s.has('show_footer');
  const openSelector = s.has('open_selector') && !s.has('select_repo');
  const selectRepo = s.has('select_repo');
  const startFetching = s.has('start_fetching');
  const fetchDone = s.has('fetch_done');

  const showReq1 = s.has('show_req_1');
  const showReq2 = s.has('show_req_2');
  const selectReq = s.has('select_req');

  const suggestQ1 = s.has('suggest_q1');
  const suggestQ2 = s.has('suggest_q2');
  const suggestQ3 = s.has('suggest_q3');
  const acceptQ1 = s.has('accept_q1');
  const acceptQ2 = s.has('accept_q2');

  const q1Visible = suggestQ1;
  const q1Suggested = suggestQ1 && !acceptQ1;
  const q2Visible = suggestQ2;
  const q2Suggested = suggestQ2 && !acceptQ2;
  const q3Visible = suggestQ3;

  return (
    <div ref={containerRef} className="absolute inset-0">
    <MiniShell visible={showShell} shadow={false} roundedRight={false} className="absolute w-[800px] h-[600px] top-[40px] left-[40px] md:left-auto md:right-0">
      <MiniSidebar
          workspaceName={WORKSPACE_NAME}
          teams={TEAMS}
          expandedProjectId={expandProject ? 'p1' : undefined}
          footer={
            <GitHubDemoRepoFooter
              visible={showFooter}
              selectorOpen={openSelector}
              repoSelected={selectRepo}
              fetching={startFetching}
              fetchDone={fetchDone}
            />
          }
        />

        <div className="flex-1 flex flex-col min-w-0">
          <MiniTopbar segments={BREADCRUMBS} />

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <MiniColumn
              title="Requirements"
              width="w-1/2"
              controls={<Plus size={8} className="text-text-quaternary" />}
            >
              {showReq1 || showReq2 ? (
                <>
                  <RequirementCard
                    req={REQUIREMENTS[0]}
                    selected={selectReq}
                    dimmed={false}
                    visible={showReq1}
                  />
                  <RequirementCard
                    req={REQUIREMENTS[1]}
                    selected={false}
                    dimmed={selectReq}
                    visible={showReq2}
                  />
                </>
              ) : (
                <MiniColumnEmpty icon={null} message="Select a requirement" />
              )}
            </MiniColumn>

            <MiniColumn
              title="Questions"
              width="w-1/2"
              borderRight={false}
              controls={selectReq ? <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" /> : undefined}
            >
              {selectReq ? (
                <>
                  <QuestionCard q={QUESTIONS[0]} visible={q1Visible} suggested={q1Suggested} selected={!q1Suggested && q1Visible} />
                  <QuestionCard q={QUESTIONS[1]} visible={q2Visible} suggested={q2Suggested} />
                  <QuestionCard q={QUESTIONS[2]} visible={q3Visible} suggested />
                </>
              ) : (
                <MiniColumnEmpty icon={null} message="Select a requirement" />
              )}
            </MiniColumn>
          </div>
        </div>
    </MiniShell>
    </div>
  );
}

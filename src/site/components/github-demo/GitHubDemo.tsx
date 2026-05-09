import { useRef, useMemo } from 'react';
import { Plus, LoaderPinwheel, Folder } from 'lucide-react';
import { MiniShell, MiniTopbar, MiniColumn, MiniColumnEmpty, MiniSidebar, MiniCursor, MiniModal, useDemoEngine } from '../mini-demo';
import type { Requirement, Question } from '../app-demo/types';
import { RequirementCard } from '../app-demo/RequirementCard';
import { QuestionCard } from '../app-demo/QuestionCard';
import { GitHubDemoRepoFooter } from './GitHubDemoRepoFooter';
import { githubDirection } from './direction';
import { REPOS } from './data';

const WORKSPACE_NAME = 'Acme Inc.';

const TEAMS = [
  {
    id: 't1',
    name: 'Engineering',
    projects: [
      { id: 'p1', name: 'Arvid', isActive: true, children: [
        { id: 'p1a', name: 'Commerce Co...' },
      ]},
      { id: 'p2', name: 'Design System', children: [] },
    ],
  },
];

const BREADCRUMBS = [
  { label: WORKSPACE_NAME },
  { label: 'Engineering', icon: Folder },
  { label: 'Arvid', icon: Folder },
];

function resolveTarget(verb: string, subject: string): string {
  if (verb === 'open' && subject === 'import-modal') return 'gh-repo-footer';
  if (verb === 'import') return 'gh-repo-footer';
  if (verb === 'extract') return 'gh-repo-footer';
  if (verb === 'suggest') return 'gh-repo-footer';
  if (verb === 'select' && subject.startsWith('gh-r')) return `modal-slack-${subject}`;
  if (verb === 'close') return 'gh-repo-footer';
  if (verb === 'select') return `req-${subject}`;
  if (verb === 'generate' && subject.startsWith('questions')) return 'gh-q-column';
  if (verb === 'accept') return `q-${subject}`;
  return 'gh-req-column';
}

export function GitHubDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, currentTransition, activeActor } = useDemoEngine(githubDirection, containerRef);
  const pool = githubDirection.contentPool;

  const repoConnected = state.imported || state.requirements.length > 0;
  const fetching = state.modalPhase === 'importing' || state.modalPhase === 'extracting';
  const showImportModal = state.modalPhase !== null && state.modalPhase !== 'selected' && !repoConnected;
  const showSuggestions = state.modalPhase === 'suggestions' || state.modalPhase === 'selected';

  const allReqs = useMemo(() =>
    pool.requirements.filter(r => state.requirements.includes(r.id)) as Requirement[],
    [state.requirements, pool.requirements],
  );

  const questionIds = state.selectedRequirement ? (state.questions[state.selectedRequirement] ?? []) : [];
  const allQuestions = useMemo(() => {
    const qPool = Object.values(pool.questions).flat() as Question[];
    return questionIds.map(id => qPool.find(q => q.id === id)).filter(Boolean) as Question[];
  }, [questionIds, pool.questions]);

  const cursorTarget = currentTransition
    ? resolveTarget(currentTransition.verb, currentTransition.subject)
    : null;

  return (
    <div ref={containerRef} className="absolute inset-0">
    <MiniShell visible shadow={false} roundedRight={false} className="absolute w-[800px] h-[600px] top-[40px] left-[40px] md:left-auto md:right-0">
      <MiniSidebar
        workspaceName={WORKSPACE_NAME}
        teams={TEAMS}
        expandedProjectId="p1"
        footer={
          <div data-cursor-target="gh-repo-footer">
            <GitHubDemoRepoFooter
              visible
              selectorOpen={false}
              repoSelected={repoConnected}
              fetching={fetching}
              fetchDone={repoConnected && !fetching}
            />
          </div>
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
            <div data-cursor-target="gh-req-column">
              {allReqs.length > 0 ? (
                allReqs.map(req => (
                  <div key={req.id} data-cursor-target={`req-${req.id}`} className="mb-2">
                    <RequirementCard
                      req={req}
                      selected={state.selectedRequirement === req.id}
                      dimmed={!!state.selectedRequirement && state.selectedRequirement !== req.id}
                      visible
                    />
                  </div>
                ))
              ) : (
                <MiniColumnEmpty icon={null} message={fetching ? 'Analyzing codebase...' : 'Connect a repository'} />
              )}
            </div>
          </MiniColumn>

          <MiniColumn
            title="Questions"
            width="w-1/2"
            borderRight={false}
            controls={state.selectedRequirement ? <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" /> : undefined}
          >
            <div data-cursor-target="gh-q-column">
              {state.selectedRequirement ? (
                allQuestions.map(q => (
                  <div key={q.id} data-cursor-target={`q-${q.id}`} className="mb-2">
                    <QuestionCard
                      q={q}
                      visible
                      suggested={!state.acceptedQuestions.includes(q.id)}
                      selected={state.selectedQuestion === q.id}
                    />
                  </div>
                ))
              ) : (
                <MiniColumnEmpty icon={null} message="Select a requirement" />
              )}
            </div>
          </MiniColumn>
        </div>
      </div>
    </MiniShell>

    <MiniModal visible={!!state.modalPhase && !repoConnected} title="Connect Repository">
      <div className="space-y-2">
        {(state.modalPhase === 'importing' || state.modalPhase === 'extracting') && (
          <div className="flex flex-col items-center py-4 space-y-2">
            <LoaderPinwheel size={14} className="text-text-tertiary animate-spin" />
            <p className="text-[7px] text-text-tertiary">Arvid is analyzing your codebase...</p>
          </div>
        )}

        {showSuggestions && pool.slackSuggestions?.map((sug, i) => (
          <div
            key={sug.id}
            data-cursor-target={`modal-slack-${sug.id}`}
            className={`flex items-center justify-between px-2 py-1.5 rounded-micro border transition-all duration-300 ${
              state.requirements.includes(sug.id)
                ? 'bg-surface-frost-08 border-border-default'
                : 'bg-surface-elevated border-border-subtle'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[7px] font-[var(--fw-medium)] text-text-primary truncate">{sug.text}</div>
              <div className="text-[6px] text-text-quaternary">{sug.source}</div>
            </div>
          </div>
        ))}
      </div>
    </MiniModal>

    {githubDirection.actors.map(actor => (
      <MiniCursor
        key={actor.id}
        name={actor.name}
        target={activeActor === actor.id && cursorTarget ? cursorTarget : ''}
        visible={activeActor === actor.id && !!cursorTarget}
        boundaryId="feature"
      />
    ))}
    </div>
  );
}

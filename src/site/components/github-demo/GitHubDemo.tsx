import { useRef, useMemo } from 'react';
import { Plus, LoaderPinwheel, Folder } from 'lucide-react';
import { MiniShell, MiniTopbar, MiniColumn, MiniColumnEmpty, MiniSidebar, MiniCursor, useDemoEngine } from '../mini-demo';
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
  if (verb === 'open' && subject === 'repo-selector') return 'gh-repo-footer';
  if (verb === 'select' && subject === 'repo') return 'gh-repo-footer';
  if (verb === 'fetch') return 'gh-repo-footer';
  if (verb === 'generate' && subject === 'requirements-from-code') return 'gh-req-column';
  if (verb === 'select') return `req-${subject}`;
  if (verb === 'generate' && subject.startsWith('questions')) return 'gh-q-column';
  if (verb === 'browse') return 'gh-q-column';
  if (verb === 'accept') return `q-${subject}`;
  return 'gh-req-column';
}

export function GitHubDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, currentTransition, activeActor } = useDemoEngine(githubDirection, containerRef);
  const pool = githubDirection.contentPool;

  const selectorOpen = state.modalPhase === 'open';
  const repoSelected = state.modalPhase === 'importing' || state.modalPhase === 'extracting' || state.browsed;
  const fetching = state.modalPhase === 'importing' || state.modalPhase === 'extracting';
  const fetchDone = state.browsed;

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
              selectorOpen={selectorOpen}
              repoSelected={repoSelected}
              fetching={fetching}
              fetchDone={fetchDone}
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
                <MiniColumnEmpty icon={null} message={fetchDone ? 'Loading...' : 'Connect a repository'} />
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

    {githubDirection.actors.map(actor => (
      <MiniCursor
        key={actor.id}
        name={actor.name}
        target={activeActor === actor.id && cursorTarget ? cursorTarget : ''}
        visible={activeActor === actor.id && !!cursorTarget}
      />
    ))}
    </div>
  );
}

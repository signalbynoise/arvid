import { useRef, useMemo } from 'react';
import { Plus, LoaderPinwheel, Folder, Slack, Mail, FileText } from 'lucide-react';
import { MiniShell, MiniTopbar, MiniColumn, MiniColumnEmpty, MiniSidebar, MiniCursor, MiniModal, useDemoEngine } from '../mini-demo';
import type { Requirement, Question } from '../app-demo/types';
import { RequirementCard } from '../app-demo/RequirementCard';
import { QuestionCard } from '../app-demo/QuestionCard';
import { connectorDirection } from './direction';

const WORKSPACE_NAME = 'Acme Inc.';

const TEAMS = [
  {
    id: 't1',
    name: 'Product',
    projects: [
      { id: 'p1', name: 'Platform', isActive: true, children: [
        { id: 'p1a', name: 'Onboarding' },
        { id: 'p1b', name: 'Billing' },
      ]},
    ],
  },
];

const BREADCRUMBS = [
  { label: WORKSPACE_NAME },
  { label: 'Product', icon: Folder },
  { label: 'Platform', icon: Folder },
];

function resolveTarget(verb: string, subject: string): string {
  if (verb === 'open' && subject === 'import-modal') return 'con-add';
  if (verb === 'import') return 'modal-import-slack';
  if (verb === 'extract') return 'modal-import-slack';
  if (verb === 'suggest') return 'modal-import-slack';
  if (verb === 'select' && subject.startsWith('con-r')) return `modal-slack-${subject}`;
  if (verb === 'close') return 'con-req-column';
  if (verb === 'select') return `req-${subject}`;
  if (verb === 'generate' && subject.startsWith('questions')) return 'con-q-column';
  if (verb === 'accept') return `q-${subject}`;
  return 'con-req-column';
}

export function ConnectorDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, currentTransition, activeActor } = useDemoEngine(connectorDirection, containerRef);
  const pool = connectorDirection.contentPool;

  const showImportModal = state.modalPhase !== null && state.modalPhase !== 'selected';
  const isExtracting = state.modalPhase === 'extracting';
  const showSuggestions = state.modalPhase === 'suggestions' || state.modalPhase === 'selected';
  const suggestionSelected = state.modalPhase === 'selected';

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
    <div ref={containerRef} data-cursor-boundary="connector-demo" className="absolute inset-0">
    <MiniShell visible shadow={false} roundedRight={false} className="absolute w-[800px] h-[600px] top-[40px] right-[40px] md:right-auto md:left-0">
      <MiniSidebar
        workspaceName={WORKSPACE_NAME}
        teams={TEAMS}
        expandedProjectId="p1"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <MiniTopbar segments={BREADCRUMBS} />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="w-1/2 shrink-0 flex flex-col bg-surface-panel border-r border-border-subtle">
            <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">Requirements</span>
              <div data-cursor-target="con-add"><Plus size={8} className="text-text-quaternary" /></div>
            </div>
            <div data-cursor-target="con-req-column" className="flex-1 p-2 space-y-2 overflow-y-auto hide-scrollbar">
              {allReqs.length > 0 ? (
                allReqs.map(req => (
                  <div key={req.id} data-cursor-target={`req-${req.id}`}>
                    <RequirementCard
                      req={req}
                      selected={state.selectedRequirement === req.id}
                      dimmed={!!state.selectedRequirement && state.selectedRequirement !== req.id}
                      visible
                    />
                  </div>
                ))
              ) : (
                <MiniColumnEmpty icon={null} message="Import requirements" />
              )}
            </div>
          </div>

          <MiniColumn
            title="Questions"
            width="w-1/2"
            borderRight={false}
            controls={state.selectedRequirement ? <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" /> : undefined}
          >
            <div data-cursor-target="con-q-column">
              {state.selectedRequirement ? (
                allQuestions.map(q => (
                  <div key={q.id} data-cursor-target={`q-${q.id}`}>
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

    <MiniModal visible={showImportModal} title="Import Requirements">
      <div className="space-y-2">
        {state.modalPhase === 'open' && (
          <div data-cursor-target="modal-import-slack" className="space-y-1.5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-standard bg-surface-frost-08 border border-border-default">
              <Slack size={10} className="text-text-primary shrink-0" />
              <span className="text-[8px] font-[var(--fw-medium)] text-text-primary">Import from Slack</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-standard bg-surface-frost-05 border border-border-subtle">
              <Mail size={10} className="text-text-quaternary shrink-0" />
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary">Import from Email</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-standard bg-surface-frost-05 border border-border-subtle">
              <FileText size={10} className="text-text-quaternary shrink-0" />
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary">Import from Document</span>
            </div>
          </div>
        )}

        {(state.modalPhase === 'importing' || isExtracting) && (
          <div className="flex flex-col items-center py-4 space-y-2">
            <LoaderPinwheel size={14} className="text-text-tertiary animate-spin" />
            <p className="text-[7px] text-text-tertiary">Arvid is extracting requirements...</p>
          </div>
        )}

        {showSuggestions && pool.slackSuggestions?.map((sug) => (
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

    {connectorDirection.actors.map(actor => (
      <MiniCursor
        key={actor.id}
        name={actor.name}
        target={activeActor === actor.id && cursorTarget ? cursorTarget : ''}
        visible={activeActor === actor.id && !!cursorTarget}
        boundaryId="connector-demo"
      />
    ))}
    </div>
  );
}

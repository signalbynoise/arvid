import { useRef, useEffect, useMemo } from 'react';
import { Plus, LoaderPinwheel, MessageSquare, FileText, BarChart3, Network, Folder, Slack } from 'lucide-react';
import { MiniShell, MiniTopbar, MiniColumn, MiniColumnEmpty, MiniCursor, MiniModal, MiniConfirmation, useDemoEngine } from '../mini-demo';
import type { Requirement, Question, Answer } from './types';
import { ProjectSidebar } from './ProjectSidebar';
import { RequirementCard } from './RequirementCard';
import { QuestionCard } from './QuestionCard';
import { AnswerCard } from './AnswerCard';
import { KnowledgeSummary } from './KnowledgeSummary';
import { heroDirection } from './direction';

const WORKSPACE_NAME = 'Acme Inc.';

const BREADCRUMBS = [
  { label: WORKSPACE_NAME },
  { label: 'Engineering', icon: Network },
  { label: 'Mobile App', icon: Folder },
];

function resolveTarget(verb: string, subject: string): string {
  if (verb === 'browse' && subject === 'requirements') return 'req-column-body';
  if (verb === 'browse' && subject === 'questions') return 'q-column-body';
  if (verb === 'open' && subject === 'import-modal') return 'req-add';
  if (verb === 'import' && subject === 'slack') return 'modal-import-slack';
  if (verb === 'extract') return 'modal-import-slack';
  if (verb === 'suggest' && subject === 'slack-results') return 'modal-import-slack';
  if (verb === 'select' && subject.startsWith('slack')) return `modal-slack-${subject}`;
  if (verb === 'close') return 'req-column-body';
  if (verb === 'select') return `req-${subject}`;
  if (verb === 'generate' && subject.startsWith('questions')) return 'q-column-body';
  if (verb === 'generate' && subject === 'summary') return 'summary';
  if (verb === 'accept') return `q-${subject}`;
  if (verb === 'answer') return `a-${subject}`;
  if (verb === 'export' && subject === 'linear') return 'btn-linear';
  if (verb === 'export' && subject === 'cursor') return 'btn-cursor';
  return 'req-column-body';
}

export function AppDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reqColumnRef = useRef<HTMLDivElement>(null);
  const qColumnRef = useRef<HTMLDivElement>(null);

  const { state, currentTransition, activeActor } = useDemoEngine(heroDirection, containerRef);

  const pool = heroDirection.contentPool;

  const allReqs = useMemo(() =>
    pool.requirements.filter(r => state.requirements.includes(r.id)) as Requirement[],
    [state.requirements, pool.requirements],
  );

  const questionIds = state.selectedRequirement ? (state.questions[state.selectedRequirement] ?? []) : [];
  const allQuestions = useMemo(() => {
    const qPool = Object.values(pool.questions).flat() as Question[];
    return questionIds.map(id => qPool.find(q => q.id === id)).filter(Boolean) as Question[];
  }, [questionIds, pool.questions]);

  const answerIds = state.selectedQuestion ? (state.answers[state.selectedQuestion] ?? []) : [];
  const allAnswers = useMemo(() => {
    const aPool = Object.values(pool.answers).flat() as Answer[];
    return answerIds.map(id => aPool.find(a => a.id === id)).filter(Boolean) as Answer[];
  }, [answerIds, pool.answers]);

  const summary = useMemo(() => ({
    title: allReqs.find(r => r.id === state.selectedRequirement)?.title ?? '',
    shortId: 'S01',
    objective: 'Analyzing requirement data and generating knowledge summary...',
    tags: ['Architecture', 'Policy', 'Scale'],
    targetCompleteness: state.completeness,
  }), [state.selectedRequirement, state.completeness, allReqs]);

  const cursorTarget = currentTransition
    ? resolveTarget(currentTransition.verb, currentTransition.subject)
    : null;

  useEffect(() => {
    if (currentTransition?.verb === 'browse' && currentTransition.subject === 'requirements' && reqColumnRef.current) {
      reqColumnRef.current.scrollTo({ top: 200, behavior: 'smooth' });
    }
  }, [currentTransition]);

  useEffect(() => {
    if (currentTransition?.verb === 'browse' && currentTransition.subject === 'questions' && qColumnRef.current) {
      qColumnRef.current.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }, [currentTransition]);

  const showImportModal = state.modalPhase !== null && state.modalPhase !== 'selected';
  const isExtracting = state.modalPhase === 'extracting';
  const showSuggestions = state.modalPhase === 'suggestions' || state.modalPhase === 'selected';
  const suggestionSelected = state.modalPhase === 'selected';

  return (
    <div ref={containerRef} className="relative w-full h-full">
    <MiniShell visible className="min-w-[900px] w-full h-full max-w-[1180px]">
      <ProjectSidebar expanded />

      <div className="flex-1 flex flex-col min-w-0">
        <MiniTopbar segments={BREADCRUMBS} />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="w-1/4 shrink-0 flex flex-col bg-surface-panel border-r border-border-subtle">
            <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">Requirements</span>
              <div data-cursor-target="req-add"><Plus size={8} className="text-text-quaternary" /></div>
            </div>
            <div ref={reqColumnRef} data-cursor-target="req-column-body" className="flex-1 p-2 space-y-2 overflow-y-auto hide-scrollbar">
              {allReqs.map(req => (
                <div key={req.id} data-cursor-target={`req-${req.id}`}>
                  <RequirementCard
                    req={req}
                    selected={state.selectedRequirement === req.id}
                    dimmed={!!state.selectedRequirement && state.selectedRequirement !== req.id}
                    visible
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-1/4 shrink-0 flex flex-col bg-surface-panel border-r border-border-subtle">
            <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">Questions</span>
              {state.selectedRequirement && <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" />}
            </div>
            <div ref={qColumnRef} data-cursor-target="q-column-body" className="flex-1 p-2 space-y-2 overflow-y-auto hide-scrollbar">
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
          </div>

          <MiniColumn
            title="Answers"
            controls={state.selectedQuestion ? <Plus size={8} className="text-text-quaternary" /> : undefined}
          >
            {state.selectedQuestion ? (
              allAnswers.map(a => (
                <div key={a.id} data-cursor-target={`a-${a.id}`}>
                  <AnswerCard answer={a} visible />
                </div>
              ))
            ) : (
              <MiniColumnEmpty
                icon={<MessageSquare size={12} className="text-text-quaternary opacity-20 mb-1" />}
                message="Select a question"
              />
            )}
          </MiniColumn>

          <MiniColumn
            title="Summary"
            borderRight={false}
            controls={state.summaryGenerated ? <BarChart3 size={8} className="text-text-quaternary" /> : undefined}
          >
            {state.summaryGenerated ? (
              <>
                <div data-cursor-target="summary">
                  <KnowledgeSummary
                    summary={summary}
                    completeness={state.completeness}
                    sendEnabled={state.completeness > 0}
                    generating={false}
                  />
                </div>
                <div data-cursor-target="btn-linear" />
                <div data-cursor-target="btn-cursor" />
                {state.exports.includes('linear') && (
                  <MiniConfirmation visible icon="/linear.svg" message={`Ticket LIN-${100 + state.cycleCount} created`} />
                )}
                {state.exports.includes('cursor') && (
                  <MiniConfirmation visible icon="/cursor.svg" message="Agents started building" />
                )}
              </>
            ) : (
              <MiniColumnEmpty
                icon={<FileText size={12} className="text-text-quaternary opacity-20 mb-1" />}
                message="Select a requirement"
              />
            )}
          </MiniColumn>
        </div>
      </div>
    </MiniShell>

    <MiniModal visible={showImportModal} title="Import Requirements">
      <div className="space-y-2">
        {state.modalPhase === 'open' && (
          <div data-cursor-target="modal-import-slack" className="flex items-center gap-2 px-3 py-2 rounded-standard bg-surface-frost-08 border border-border-default">
            <Slack size={10} className="text-text-primary shrink-0" />
            <span className="text-[8px] font-[var(--fw-medium)] text-text-primary">Import from Slack</span>
          </div>
        )}

        {(state.modalPhase === 'importing' || isExtracting) && (
          <div className="flex flex-col items-center py-4 space-y-2">
            <LoaderPinwheel size={14} className="text-text-tertiary animate-spin" />
            <p className="text-[7px] text-text-tertiary">Arvid is analyzing Slack messages...</p>
          </div>
        )}

        {showSuggestions && pool.slackSuggestions?.map((sug, i) => (
          <div
            key={sug.id}
            data-cursor-target={`modal-slack-${sug.id}`}
            className={`flex items-center justify-between px-2 py-1.5 rounded-micro border transition-all duration-300 ${
              suggestionSelected && i === 0
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

    {heroDirection.actors.map(actor => (
      <MiniCursor
        key={actor.id}
        name={actor.name}
        target={activeActor === actor.id && cursorTarget ? cursorTarget : ''}
        visible={activeActor === actor.id && !!cursorTarget}
        boundaryId="hero"
      />
    ))}
    </div>
  );
}

import React, { useRef, useEffect, useMemo } from 'react';
import { Plus, LoaderPinwheel, MessageSquare, FileText, BarChart3, Slack, Mail, FileText as FileDoc } from 'lucide-react';
import { MiniShell } from './MiniShell';
import { MiniTopbar } from './MiniTopbar';
import { MiniColumn, MiniColumnEmpty, MINI_DEMO_COLUMN_MIN_WIDTH_CLASS } from './MiniColumn';
import { MiniSidebar } from './MiniSidebar';
import { MiniSidebarFooterItem } from './MiniSidebarFooterItem';
import { MiniDivider } from './MiniDivider';
import { MiniSidebarFooter } from './MiniSidebarFooter';
import { MiniCursor } from './MiniCursor';
import { MiniModal } from './MiniModal';
import { MiniConfirmation } from './MiniConfirmation';
import { useDemoEngine } from './useDemoEngine';
import type { Direction, DemoLayoutConfig } from './types';

import { RequirementCard } from '../app-demo/RequirementCard';
import { QuestionCard } from '../app-demo/QuestionCard';
import { AnswerCard } from '../app-demo/AnswerCard';
import { KnowledgeSummary } from '../app-demo/KnowledgeSummary';
import type { Requirement, Question, Answer } from '../app-demo/types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  slack: Slack,
  mail: Mail,
  file: FileDoc,
};

function resolveTarget(verb: string, subject: string): string {
  if (verb === 'browse') return 'ds-req-column';
  if (verb === 'open' && subject === 'import-modal') return 'ds-add-btn';
  if (verb === 'import') return 'ds-modal-action';
  if (verb === 'extract') return 'ds-modal-action';
  if (verb === 'suggest') return 'ds-modal-action';
  if (verb === 'select' && subject.includes('-r')) return `ds-modal-sug-${subject}`;
  if (verb === 'close') return 'ds-req-column';
  if (verb === 'select') return `ds-req-${subject}`;
  if (verb === 'generate' && subject.startsWith('questions')) return 'ds-q-column';
  if (verb === 'generate' && subject === 'summary') return 'ds-summary';
  if (verb === 'accept') return `ds-q-${subject}`;
  if (verb === 'answer') return `ds-a-${subject}`;
  if (verb === 'export' && subject === 'linear') return 'ds-btn-linear';
  if (verb === 'export' && subject === 'cursor') return 'ds-btn-cursor';
  if (verb === 'delete') return `ds-req-${subject}`;
  return 'ds-req-column';
}

interface DemoShellProps {
  direction: Direction;
  layout: DemoLayoutConfig;
}

export function DemoShellView({ direction, layout }: DemoShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reqColumnRef = useRef<HTMLDivElement>(null);
  const qColumnRef = useRef<HTMLDivElement>(null);

  const { state, currentTransition, activeActor } = useDemoEngine(direction, containerRef);
  const pool = direction.contentPool;

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
  const isExtracting = state.modalPhase === 'importing' || state.modalPhase === 'extracting';
  const showSuggestions = state.modalPhase === 'suggestions' || state.modalPhase === 'selected';

  const hasReqColumn = layout.columns.some(c => c.key === 'requirements');
  const hasQColumn = layout.columns.some(c => c.key === 'questions');
  const hasAColumn = layout.showAnswers;
  const hasSummary = layout.showSummary;

  return (
    <div ref={containerRef} data-cursor-boundary={layout.boundaryId} className={layout.shell.containerClassName ?? 'absolute inset-0'}>
    <MiniShell visible shadow={layout.shell.shadow} roundedRight={layout.shell.roundedRight} roundedBottom={layout.shell.roundedBottom} className={layout.shell.className}>
      <MiniSidebar
        workspaceName={layout.workspace}
        teams={layout.sidebar.teams}
        expandedProjectId={layout.sidebar.expandedProjectId}
        footer={layout.sidebar.integrations ? (
          <>
            <MiniDivider />
            <MiniSidebarFooter>
              {layout.sidebar.integrations.map((int, i) => (
                <React.Fragment key={int.label}>
                  {i > 0 && <MiniDivider />}
                  <MiniSidebarFooterItem icon={int.icon} label={int.label} isConnected={int.connected} value={int.value} />
                </React.Fragment>
              ))}
            </MiniSidebarFooter>
          </>
        ) : undefined}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <MiniTopbar segments={layout.breadcrumbs} />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {hasReqColumn && (() => {
            const col = layout.columns.find(c => c.key === 'requirements')!;
            return (
              <div className={`${col.width ?? 'flex-1'} ${MINI_DEMO_COLUMN_MIN_WIDTH_CLASS} flex flex-col bg-surface-panel ${col.borderRight !== false ? 'border-r border-border-subtle' : ''}`}>
                <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
                  <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">{col.title}</span>
                  <div data-cursor-target="ds-add-btn"><Plus size={8} className="text-text-quaternary" /></div>
                </div>
                <div ref={reqColumnRef} data-cursor-target="ds-req-column" className="flex-1 p-2 space-y-2 overflow-y-auto hide-scrollbar">
                  {allReqs.length > 0 ? (
                    allReqs.map(req => (
                      <div key={req.id} data-cursor-target={`ds-req-${req.id}`}>
                        <RequirementCard
                          req={req}
                          selected={state.selectedRequirement === req.id}
                          dimmed={!!state.selectedRequirement && state.selectedRequirement !== req.id}
                          visible
                        />
                      </div>
                    ))
                  ) : (
                    <MiniColumnEmpty icon={null} message="No requirements yet" />
                  )}
                </div>
              </div>
            );
          })()}

          {hasQColumn && (() => {
            const col = layout.columns.find(c => c.key === 'questions')!;
            return (
              <div className={`${col.width ?? 'flex-1'} ${MINI_DEMO_COLUMN_MIN_WIDTH_CLASS} flex flex-col bg-surface-panel ${col.borderRight !== false ? 'border-r border-border-subtle' : ''}`}>
                <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
                  <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">{col.title}</span>
                  {state.selectedRequirement && <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" />}
                </div>
                <div ref={qColumnRef} data-cursor-target="ds-q-column" className="flex-1 p-2 space-y-2 overflow-y-auto hide-scrollbar">
                  {state.selectedRequirement ? (
                    allQuestions.map(q => (
                      <div key={q.id} data-cursor-target={`ds-q-${q.id}`}>
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
            );
          })()}

          {hasAColumn && (
            <MiniColumn
              title="Answers"
              width="flex-1"
              controls={state.selectedQuestion ? <Plus size={8} className="text-text-quaternary" /> : undefined}
            >
              {state.selectedQuestion ? (
                allAnswers.map(a => (
                  <div key={a.id} data-cursor-target={`ds-a-${a.id}`}>
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
          )}

          {hasSummary && (
            <MiniColumn
              title="Summary"
              width="flex-1"
              borderRight={false}
              controls={state.summaryGenerated ? <BarChart3 size={8} className="text-text-quaternary" /> : undefined}
            >
              {state.summaryGenerated ? (
                <>
                  <div data-cursor-target="ds-summary">
                    <KnowledgeSummary
                      summary={summary}
                      completeness={state.completeness}
                      sendEnabled={state.completeness > 0}
                      generating={false}
                    />
                  </div>
                  <div data-cursor-target="ds-btn-linear" />
                  <div data-cursor-target="ds-btn-cursor" />
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
          )}
        </div>
      </div>
    </MiniShell>

    {layout.modal && (
      <MiniModal visible={showImportModal} title={layout.modal.title}>
        <div className="space-y-2">
          {state.modalPhase === 'open' && (
            <div data-cursor-target="ds-modal-action" className="space-y-1.5">
              {(layout.modal.importOptions ?? [{ icon: 'slack', label: 'Import from Slack', primary: true }]).map((opt, i) => {
                const Icon = ICON_MAP[opt.icon] ?? Slack;
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-standard border ${opt.primary !== false ? 'bg-surface-frost-08 border-border-default' : 'bg-surface-frost-05 border-border-subtle'}`}>
                    <Icon size={10} className={opt.primary !== false ? 'text-text-primary shrink-0' : 'text-text-quaternary shrink-0'} />
                    <span className={`text-[8px] font-[var(--fw-medium)] ${opt.primary !== false ? 'text-text-primary' : 'text-text-tertiary'}`}>{opt.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {isExtracting && (
            <div className="flex flex-col items-center py-4 space-y-2">
              <LoaderPinwheel size={14} className="text-text-tertiary animate-spin" />
              <p className="text-[7px] text-text-tertiary">{layout.modal.extractingMessage}</p>
            </div>
          )}

          {showSuggestions && pool.slackSuggestions?.map(sug => (
            <div
              key={sug.id}
              data-cursor-target={`ds-modal-sug-${sug.id}`}
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
    )}

    {direction.actors.map(actor => (
      <MiniCursor
        key={actor.id}
        name={actor.name}
        target={activeActor === actor.id && cursorTarget ? cursorTarget : ''}
        visible={activeActor === actor.id && !!cursorTarget}
        boundaryId={layout.boundaryId}
      />
    ))}
    </div>
  );
}

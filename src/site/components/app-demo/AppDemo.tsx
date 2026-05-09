import { useRef, useEffect } from 'react';
import { Plus, LoaderPinwheel, MessageSquare, FileText, BarChart3, Network, Folder, Slack } from 'lucide-react';
import { MiniShell, MiniTopbar, MiniColumn, MiniColumnEmpty, MiniCursor, MiniModal, MiniConfirmation, useSequence } from '../mini-demo';
import { ProjectSidebar } from './ProjectSidebar';
import { RequirementCard } from './RequirementCard';
import { QuestionCard } from './QuestionCard';
import { AnswerCard } from './AnswerCard';
import { KnowledgeSummary } from './KnowledgeSummary';
import {
  REQUIREMENTS,
  IMPORTED_REQUIREMENT,
  QUESTIONS_R13,
  ANSWERS_R13,
  SUMMARY_R13,
  SLACK_SUGGESTIONS,
  SEQUENCE,
  WORKSPACE_NAME,
  COLLABORATORS,
} from './data';

const BREADCRUMBS = [
  { label: WORKSPACE_NAME },
  { label: 'Engineering', icon: Network },
  { label: 'Mobile App', icon: Folder },
];

export function AppDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reqColumnRef = useRef<HTMLDivElement>(null);
  const qColumnRef = useRef<HTMLDivElement>(null);
  const s = useSequence(SEQUENCE, containerRef);

  const showShell = s.has('show_shell');
  const showReqs = s.has('show_requirements');
  const scrolledReqs = s.has('scroll_requirements');

  const showImportModal = s.has('show_import_modal') && !s.has('close_modal');
  const extractingSlack = s.has('extracting_slack') && !s.has('show_slack_options');
  const showSlackOptions = s.has('show_slack_options');
  const slackItemSelected = s.has('select_slack_item');
  const modalClosed = s.has('close_modal');

  const reqSelected = s.has('select_requirement');
  const showSummary = s.has('show_summary');

  const visibleQuestions = [
    s.has('suggest_q1'),
    s.has('suggest_q2'),
    s.has('suggest_q3'),
    s.has('suggest_q4'),
    s.has('suggest_q5'),
    s.has('suggest_q6'),
  ];
  const scrolledQ = s.has('scroll_questions');
  const acceptQ1 = s.has('accept_q1');
  const acceptQ2 = s.has('accept_q2');
  const selectQuestion = s.has('select_question');
  const showAnswer1 = s.has('show_answer_1');
  const showAnswer2 = s.has('show_answer_2');

  const animComp = s.has('animate_completeness');
  const showLinear = s.has('show_linear_confirmation');
  const showCursor = s.has('show_cursor_confirmation');

  const summaryGenerating = showSummary && !animComp;
  const completeness = animComp ? SUMMARY_R13.targetCompleteness : 0;

  const allReqs = modalClosed ? [...REQUIREMENTS, IMPORTED_REQUIREMENT] : REQUIREMENTS;
  const selectedReqIdx = reqSelected ? allReqs.length - 1 : -1;

  useEffect(() => {
    if (scrolledReqs && reqColumnRef.current) {
      reqColumnRef.current.scrollTo({ top: 200, behavior: 'smooth' });
    }
    if (!scrolledReqs && reqColumnRef.current) {
      reqColumnRef.current.scrollTop = 0;
    }
  }, [scrolledReqs]);

  useEffect(() => {
    if (scrolledQ && qColumnRef.current) {
      qColumnRef.current.scrollTo({ top: 120, behavior: 'smooth' });
    }
    if (!scrolledQ && qColumnRef.current) {
      qColumnRef.current.scrollTop = 0;
    }
  }, [scrolledQ]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
    <MiniShell visible={showShell} className="min-w-[900px] w-full h-full max-w-[1180px]">
      <ProjectSidebar expanded={showReqs} />

      <div className="flex-1 flex flex-col min-w-0">
        <MiniTopbar segments={BREADCRUMBS} />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="w-1/4 shrink-0 flex flex-col bg-surface-panel border-r border-border-subtle">
            <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">Requirements</span>
              <div data-cursor-target="req-add"><Plus size={8} className="text-text-quaternary" /></div>
            </div>
            <div ref={reqColumnRef} data-cursor-target="req-column-body" className="flex-1 p-2 space-y-2 overflow-y-auto hide-scrollbar">
              {allReqs.map((req, i) => (
                <div key={req.id} data-cursor-target={`req-${req.id}`}>
                  <RequirementCard
                    req={req}
                    selected={selectedReqIdx === i}
                    dimmed={reqSelected && selectedReqIdx !== i}
                    visible={showReqs}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-1/4 shrink-0 flex flex-col bg-surface-panel border-r border-border-subtle">
            <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">Questions</span>
              {reqSelected && <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" />}
            </div>
            <div ref={qColumnRef} data-cursor-target="q-column-body" className="flex-1 p-2 space-y-2 overflow-y-auto hide-scrollbar">
              {reqSelected ? (
                QUESTIONS_R13.map((q, i) => {
                  const isVisible = visibleQuestions[i] ?? (i < 6 && visibleQuestions[5]);
                  const isSuggested = isVisible && !(
                    (i === 0 && acceptQ1) || (i === 1 && acceptQ2)
                  );
                  const isSelected = i === 0 && selectQuestion && acceptQ1;
                  return (
                    <div key={q.id} data-cursor-target={`q-${q.id}`}>
                      <QuestionCard
                        q={q}
                        visible={isVisible}
                        suggested={isSuggested}
                        selected={isSelected}
                      />
                    </div>
                  );
                })
              ) : (
                <MiniColumnEmpty icon={null} message="Select a requirement" />
              )}
            </div>
          </div>

          <MiniColumn
            title="Answers"
            controls={selectQuestion ? <Plus size={8} className="text-text-quaternary" /> : undefined}
          >
            {selectQuestion ? (
              <>
                <div data-cursor-target="a-a1"><AnswerCard answer={ANSWERS_R13[0]} visible={showAnswer1} /></div>
                <div data-cursor-target="a-a2"><AnswerCard answer={ANSWERS_R13[1]} visible={showAnswer2} /></div>
              </>
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
            controls={showSummary ? <BarChart3 size={8} className="text-text-quaternary" /> : undefined}
          >
            {showSummary ? (
              <>
                <div data-cursor-target="summary">
                  <KnowledgeSummary
                    summary={SUMMARY_R13}
                    completeness={completeness}
                    sendEnabled={animComp}
                    generating={summaryGenerating}
                  />
                </div>
                <div data-cursor-target="btn-linear" />
                <div data-cursor-target="btn-cursor" />
                {showLinear && (
                  <MiniConfirmation visible icon="/linear.svg" message="Ticket LIN-142 created" />
                )}
                {showCursor && (
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
        {!extractingSlack && !showSlackOptions && (
          <div data-cursor-target="modal-import-slack" className="flex items-center gap-2 px-3 py-2 rounded-standard bg-surface-frost-08 border border-border-default">
            <Slack size={10} className="text-text-primary shrink-0" />
            <span className="text-[8px] font-[var(--fw-medium)] text-text-primary">Import from Slack</span>
          </div>
        )}

        {extractingSlack && (
          <div className="flex flex-col items-center py-4 space-y-2">
            <LoaderPinwheel size={14} className="text-text-tertiary animate-spin" />
            <p className="text-[7px] text-text-tertiary">Arvid is analyzing Slack messages...</p>
          </div>
        )}

        {showSlackOptions && SLACK_SUGGESTIONS.map((sug, i) => (
          <div
            key={sug.id}
            data-cursor-target={`modal-slack-${sug.id}`}
            className={`flex items-center justify-between px-2 py-1.5 rounded-micro border transition-all duration-300 ${
              slackItemSelected && i === 0
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

    {COLLABORATORS.map(c => {
      const pos = s.cursors.get(c.id);
      return pos ? (
        <MiniCursor
          key={c.id}
          name={c.name}
          target={pos.target}
          visible={pos.visible !== false}
        />
      ) : null;
    })}
    </div>
  );
}

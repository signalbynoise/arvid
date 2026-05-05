import { Plus, LoaderPinwheel, MessageSquare, FileText, PanelLeft } from 'lucide-react';
import { useSequence } from './useSequence';
import { DemoSidebar } from './DemoSidebar';
import { DemoRequirementCard } from './DemoRequirementCard';
import { DemoQuestionCard } from './DemoQuestionCard';
import { DemoAnswerCard } from './DemoAnswerCard';
import { DemoSummary } from './DemoSummary';
import {
  REQUIREMENTS,
  QUESTIONS_R1,
  QUESTIONS_R2,
  ANSWERS_R1,
  ANSWERS_R2,
  SUMMARY_R1,
  SUMMARY_R2,
  SEQUENCE,
} from './data';

export function AppDemo() {
  const s = useSequence(SEQUENCE);

  const showShell = s.has('show_shell');
  const projectExpanded = s.has('expand_project');
  const showReqs = s.has('show_requirements');

  const req0Selected = s.has('select_req_0') && !s.has('select_req_1');
  const req1Selected = s.has('select_req_1');
  const anyReqSelected = s.has('select_req_0');
  const activeReqIdx = req1Selected ? 1 : req0Selected ? 0 : -1;

  const showSummaryR1 = s.has('show_summary') && !req1Selected;
  const showSummaryR2 = s.has('show_summary_r2');
  const showSummary = req1Selected ? showSummaryR2 : showSummaryR1;

  const suggestQ1 = s.has('suggest_q1');
  const suggestQ2 = s.has('suggest_q2');
  const suggestQ3 = s.has('suggest_q3');
  const acceptQ1 = s.has('accept_q1');
  const acceptQ2 = s.has('accept_q2');

  const suggestQ4 = s.has('suggest_q4');
  const acceptQ4 = s.has('accept_q4');
  const suggestQ5 = s.has('suggest_q5');

  const selectQuestion = s.has('select_question') && !req1Selected;
  const selectQuestionR2 = s.has('select_question_r2');
  const questionIsSelected = req1Selected ? selectQuestionR2 : selectQuestion;

  const showA1 = s.has('show_answer_1');
  const showA2 = s.has('show_answer_2');
  const showAR2 = s.has('show_answer_r2');

  const animComp1 = s.has('animate_completeness');
  const animComp2 = s.has('animate_completeness_r2');
  const sendEnabled = s.has('enable_send');

  const activeSummary = req1Selected ? SUMMARY_R2 : SUMMARY_R1;
  const summaryGenerating = showSummary && !(req1Selected ? animComp2 : animComp1);
  const completeness = req1Selected
    ? (animComp2 ? SUMMARY_R2.targetCompleteness : 0)
    : (animComp1 ? SUMMARY_R1.targetCompleteness : 0);

  const q1Visible = !req1Selected && suggestQ1;
  const q1Suggested = !req1Selected && suggestQ1 && !acceptQ1;
  const q2Visible = !req1Selected && suggestQ2;
  const q2Suggested = !req1Selected && suggestQ2 && !acceptQ2;
  const q3Visible = !req1Selected && suggestQ3;

  const q4Visible = req1Selected && suggestQ4;
  const q4Suggested = req1Selected && suggestQ4 && !acceptQ4;
  const q5Visible = req1Selected && suggestQ5;

  return (
    <div className={`max-w-[1040px] w-full h-full flex rounded-lg overflow-hidden border border-border-subtle bg-surface-base shadow-elevated transition-all duration-700 ${
      showShell ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    }`}>
      <DemoSidebar expanded={projectExpanded} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-8 border-b border-border-subtle flex items-center px-3 bg-surface-panel shrink-0">
          <PanelLeft size={10} className="text-text-tertiary" />
          <div className="ml-auto flex items-center space-x-1.5">
            <div className="w-4 h-4 rounded-full bg-surface-frost-08 border border-border-subtle" />
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Requirements */}
          <div className="w-1/4 shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
            <div className="p-2 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">1. Requirements</span>
              <Plus size={8} className="text-text-quaternary" />
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {REQUIREMENTS.map((req, i) => (
                <DemoRequirementCard
                  key={req.id}
                  req={req}
                  selected={activeReqIdx === i}
                  dimmed={anyReqSelected && activeReqIdx !== i}
                  visible={showReqs}
                />
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="w-1/4 shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
            <div className="p-2 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">2. Questions</span>
              {anyReqSelected && <LoaderPinwheel size={8} className="text-text-tertiary animate-spin" />}
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {req1Selected ? (
                <>
                  <DemoQuestionCard q={QUESTIONS_R2[0]} visible={q4Visible} suggested={q4Suggested} selected={selectQuestionR2 && !q4Suggested} />
                  <DemoQuestionCard q={QUESTIONS_R2[1]} visible={q5Visible} suggested />
                </>
              ) : anyReqSelected ? (
                <>
                  <DemoQuestionCard q={QUESTIONS_R1[0]} visible={q1Visible} suggested={q1Suggested} selected={selectQuestion && !q1Suggested} />
                  <DemoQuestionCard q={QUESTIONS_R1[1]} visible={q2Visible} suggested={q2Suggested} />
                  <DemoQuestionCard q={QUESTIONS_R1[2]} visible={q3Visible} suggested />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center h-full">
                  <p className="text-[8px] text-text-quaternary">Select a requirement</p>
                </div>
              )}
            </div>
          </div>

          {/* Answers */}
          <div className="w-1/4 shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
            <div className="p-2 border-b border-border-subtle flex items-center justify-between">
              <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">3. Answers</span>
              {questionIsSelected && <Plus size={8} className="text-text-quaternary" />}
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {questionIsSelected ? (
                req1Selected ? (
                  <DemoAnswerCard answer={ANSWERS_R2[0]} visible={showAR2} />
                ) : (
                  <>
                    <DemoAnswerCard answer={ANSWERS_R1[0]} visible={showA1} />
                    <DemoAnswerCard answer={ANSWERS_R1[1]} visible={showA2} />
                  </>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center h-full">
                  <MessageSquare size={12} className="text-text-quaternary opacity-20 mb-1" />
                  <p className="text-[8px] text-text-quaternary">Select a question</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="w-1/4 shrink-0 min-w-0 bg-surface-panel">
            {showSummary ? (
              <DemoSummary
                summary={activeSummary}
                completeness={completeness}
                sendEnabled={!req1Selected && sendEnabled}
                generating={summaryGenerating}
              />
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b border-border-subtle flex items-center justify-between">
                  <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">4. Summary</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <FileText size={12} className="text-text-quaternary opacity-20 mb-1" />
                  <p className="text-[8px] text-text-quaternary">Select a requirement</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder,
  Hash,
  ChevronDown,
  Plus,
  User,
  Check,
  X,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Clock,
  MessageSquare,
  LoaderPinwheel,
  FileText,
  PanelLeft,
  ArrowUpRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

const PROJECTS = [
  { id: 'p1', name: 'Mobile App', icon: Folder, children: [
    { id: 'p1a', name: 'Auth Flow', icon: Hash },
    { id: 'p1b', name: 'Dashboard', icon: Hash },
  ]},
  { id: 'p2', name: 'Design System', icon: Folder, children: [] },
  { id: 'p3', name: 'API v2', icon: Folder, children: [] },
];

const REQUIREMENTS = [
  { id: 'r1', title: 'User authentication with SSO support', owner: 'Sarah K.', completeness: 85, clarity: 'High', risk: 'Low' },
  { id: 'r2', title: 'Real-time notifications system', owner: 'James L.', completeness: 42, clarity: 'Medium', risk: 'Medium' },
  { id: 'r3', title: 'Data export & reporting module', owner: 'Emily R.', completeness: 15, clarity: 'Low', risk: 'High' },
];

interface QuestionData {
  id: string;
  text: string;
  status: string;
  importance: string;
  category: string;
}

const QUESTIONS_R1: QuestionData[] = [
  { id: 'q1', text: 'What identity providers should be supported beyond Google?', status: 'Answered', importance: 'Critical', category: 'Security' },
  { id: 'q2', text: 'Should session tokens use JWT or opaque references?', status: 'Answered', importance: 'Important', category: 'Architecture' },
  { id: 'q3', text: 'What is the expected concurrent user load at launch?', status: 'Unanswered', importance: 'Critical', category: 'Scale' },
];

const QUESTIONS_R2: QuestionData[] = [
  { id: 'q4', text: 'Should notifications support push, email, or both?', status: 'Answered', importance: 'Critical', category: 'Channels' },
  { id: 'q5', text: 'What is the acceptable delivery latency for real-time alerts?', status: 'Unanswered', importance: 'Important', category: 'Performance' },
];

interface AnswerData {
  id: string;
  author: string;
  date: string;
  text: string;
  isCurrent: boolean;
}

const ANSWERS_R1: AnswerData[] = [
  { id: 'a1', author: 'Sarah K.', date: 'May 2', text: 'We need Google, Microsoft Entra ID, and generic SAML for enterprise clients.', isCurrent: true },
  { id: 'a2', author: 'David M.', date: 'Apr 28', text: 'Start with Google and Microsoft. SAML can come in v2 if needed.', isCurrent: false },
];

const ANSWERS_R2: AnswerData[] = [
  { id: 'a3', author: 'James L.', date: 'May 3', text: 'Both push and email. Push for urgent, email for digests.', isCurrent: true },
];

interface SummaryData {
  title: string;
  objective: string;
  tags: string[];
  targetCompleteness: number;
}

const SUMMARY_R1: SummaryData = {
  title: 'User authentication with SSO support',
  objective: 'Implement SSO authentication supporting Google, Microsoft, and SAML providers with session management...',
  tags: ['OAuth 2.0', 'JWT tokens', 'RBAC'],
  targetCompleteness: 85,
};

const SUMMARY_R2: SummaryData = {
  title: 'Real-time notifications system',
  objective: 'Build a multi-channel notification system with push and email delivery, configurable per-user preferences...',
  tags: ['WebSockets', 'FCM', 'SendGrid'],
  targetCompleteness: 42,
};

interface TimelineStep {
  at: number;
  action: string;
}

const TIMELINE: TimelineStep[] = [
  // Phase 0: Shell
  { at: 0, action: 'show_shell' },
  { at: 600, action: 'expand_project' },
  { at: 1200, action: 'show_requirements' },

  // Phase 1: First requirement
  { at: 2200, action: 'select_req_0' },
  { at: 2800, action: 'show_summary' },
  { at: 3200, action: 'suggest_q1' },
  { at: 3800, action: 'suggest_q2' },
  { at: 4400, action: 'accept_q1' },
  { at: 5000, action: 'suggest_q3' },
  { at: 5500, action: 'accept_q2' },
  { at: 6200, action: 'select_question' },
  { at: 6600, action: 'show_answer_1' },
  { at: 7100, action: 'show_answer_2' },
  { at: 7600, action: 'animate_completeness' },
  { at: 9200, action: 'enable_send' },

  // Phase 2: Second requirement
  { at: 10800, action: 'select_req_1' },
  { at: 11400, action: 'show_summary_r2' },
  { at: 11800, action: 'suggest_q4' },
  { at: 12400, action: 'accept_q4' },
  { at: 12800, action: 'suggest_q5' },
  { at: 13400, action: 'select_question_r2' },
  { at: 13800, action: 'show_answer_r2' },
  { at: 14400, action: 'animate_completeness_r2' },

  { at: 16500, action: 'reset' },
];

const LOOP_DURATION = 17000;

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

function DemoSidebar({ expanded }: { expanded: boolean }) {
  return (
    <div className="w-[140px] shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
      <div className="h-8 flex items-center px-3 border-b border-border-subtle shrink-0">
        <img src="/logo_wide.svg" alt="Arvid" className="h-3" />
      </div>

      <div className="flex-1 py-2 overflow-hidden">
        <div className="flex items-center justify-between px-3 mb-1.5">
          <span className="text-[8px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Projects</span>
          <Plus size={8} className="text-text-quaternary" />
        </div>

        {PROJECTS.map(p => (
          <div key={p.id}>
            <div className={`flex items-center space-x-1.5 px-3 py-1 text-[9px] rounded-sm mx-1 transition-colors duration-300 ${
              p.id === 'p1' ? 'bg-surface-frost-08 text-text-primary' : 'text-text-tertiary'
            }`}>
              {p.children.length > 0 && <ChevronDown size={8} className="shrink-0" />}
              <p.icon size={9} className="shrink-0 text-text-quaternary" />
              <span className="truncate font-[var(--fw-medium)]">{p.name}</span>
            </div>
            {expanded && p.children.length > 0 && (
              <div className="ml-3">
                {p.children.map(c => (
                  <div key={c.id} className="flex items-center space-x-1.5 px-3 py-0.5 text-[8px] text-text-tertiary transition-all duration-500">
                    <c.icon size={8} className="shrink-0 text-text-quaternary" />
                    <span className="truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoRequirementCard({ req, selected, visible, dimmed }: {
  req: typeof REQUIREMENTS[0];
  selected: boolean;
  visible: boolean;
  dimmed: boolean;
}) {
  const clarityColor = req.clarity === 'High' ? 'bg-status-success' : req.clarity === 'Medium' ? 'bg-status-warning' : 'bg-status-error';
  const riskColor = req.risk === 'Low' ? 'bg-status-success' : req.risk === 'Medium' ? 'bg-status-warning' : 'bg-status-error';
  const barColor = req.completeness >= 80 ? 'bg-status-success' : req.completeness >= 50 ? 'bg-status-warning' : 'bg-status-error';

  return (
    <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    } ${selected ? 'bg-surface-frost-05' : 'bg-surface-frost-02'} ${
      dimmed ? 'opacity-30' : ''
    }`}>
      <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight mb-1.5">{req.title}</h4>
      <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
        <User size={8} className="opacity-70" />
        <span>{req.owner}</span>
      </div>
      <div className="flex items-center justify-between text-[7px]">
        <div className="flex items-center space-x-1.5">
          <div className="w-8 h-1 bg-surface-frost-10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${req.completeness}%` }} />
          </div>
          <span className="text-text-secondary font-[var(--fw-medium)]">{req.completeness}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${clarityColor}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${riskColor}`} />
        </div>
      </div>
    </div>
  );
}

function DemoQuestionCard({ q, visible, selected = false, suggested = false }: {
  q: QuestionData;
  visible: boolean;
  selected?: boolean;
  suggested?: boolean;
}) {
  const StatusIcon = q.status === 'Answered' ? CheckCircle2 : q.status === 'Unanswered' ? CircleDashed : AlertCircle;
  const statusColor = q.status === 'Answered' ? 'text-status-success' : q.status === 'Unanswered' ? 'text-status-error' : 'text-status-warning';
  const statusBg = q.status === 'Answered' ? 'bg-status-success-surface border-status-success-border' : q.status === 'Unanswered' ? 'bg-status-error-surface border-status-error-border' : 'bg-status-warning-surface border-status-warning-border';

  if (suggested) {
    return (
      <div className={`p-2.5 rounded-md border border-dashed border-border-strong bg-surface-frost-01 transition-all duration-500 ${
        visible ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-3'
      }`}>
        <div className="flex items-center mb-1.5">
          <span className="text-[6px] font-[var(--fw-medium)] text-text-tertiary bg-surface-frost-05 px-1 py-0.5 rounded-sm uppercase tracking-wider border border-border-subtle">AI Suggestion</span>
        </div>
        <h4 className="text-[9px] font-[var(--fw-regular)] text-text-tertiary leading-snug mb-2">{q.text}</h4>
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
    );
  }

  return (
    <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
    } ${selected ? 'bg-surface-frost-05' : 'bg-surface-frost-02'}`}>
      <h4 className="text-[9px] font-[var(--fw-regular)] text-text-primary leading-snug mb-2">{q.text}</h4>
      <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
        <LoaderPinwheel size={8} className="opacity-70" />
        <span>Arvid</span>
      </div>
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-sm border text-[7px] font-[var(--fw-medium)] ${statusColor} ${statusBg}`}>
          <StatusIcon size={7} />
          <span>{q.status}</span>
        </div>
        <span className="text-[7px] text-text-quaternary uppercase tracking-wider font-[var(--fw-medium)]">{q.category}</span>
      </div>
    </div>
  );
}

function DemoAnswerCard({ answer, visible }: { answer: AnswerData; visible: boolean }) {
  return (
    <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
      visible ? (answer.isCurrent ? 'opacity-100' : 'opacity-70') : 'opacity-0'
    } ${visible ? 'translate-y-0' : 'translate-y-3'} ${answer.isCurrent ? 'bg-surface-frost-05' : 'bg-surface-frost-02'}`}>
      <div className="flex items-center space-x-2 text-[8px] text-text-tertiary mb-1.5">
        <div className="flex items-center space-x-1">
          <User size={7} />
          <span className="font-[var(--fw-medium)] text-text-secondary">{answer.author}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock size={7} />
          <span>{answer.date}</span>
        </div>
      </div>
      <p className="text-[8px] text-text-primary leading-relaxed mb-2">{answer.text}</p>
      <div className="border-t border-border-subtle pt-1.5">
        <div className={`inline-flex items-center space-x-1 text-[7px] font-[var(--fw-medium)] px-1.5 py-0.5 rounded-sm border border-border-subtle ${
          answer.isCurrent ? 'bg-surface-frost-08 text-text-primary' : 'bg-surface-frost-02 text-text-tertiary'
        }`}>
          <Check size={6} />
          <span>{answer.isCurrent ? 'Active' : 'Mark Active'}</span>
        </div>
      </div>
    </div>
  );
}

function DemoSummary({ summary, completeness, sendEnabled, generating }: {
  summary: SummaryData;
  completeness: number;
  sendEnabled: boolean;
  generating: boolean;
}) {
  const barColor = completeness >= 80 ? 'bg-status-success' : completeness >= 30 ? 'bg-status-warning' : 'bg-status-error';

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">4. Summary</span>
      </div>

      <div className="flex-1 p-2 overflow-hidden">
        <div className="bg-surface-frost-02 border border-border-subtle rounded-md overflow-hidden">
          <div className="p-2 border-b border-border-subtle">
            <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight">{summary.title}</h4>
            <div className="flex items-center space-x-1 mt-1">
              <LoaderPinwheel size={7} className="text-text-tertiary" />
              <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Arvid Specification</span>
            </div>
          </div>

          <div className="p-2 space-y-2">
            {generating ? (
              <div className="flex flex-col items-center py-4 space-y-2">
                <Loader2 size={12} className="text-text-tertiary animate-spin" />
                <p className="text-[7px] text-text-tertiary">Arvid is analyzing...</p>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[7px] text-text-tertiary font-[var(--fw-medium)]">Knowledge Completeness</span>
                    <span className={`text-[8px] font-[var(--fw-medium)] ${completeness >= 80 ? 'text-status-success' : 'text-status-warning'}`}>{completeness}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-frost-10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${barColor}`} style={{ width: `${completeness}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Sparkles size={7} className="text-text-quaternary" />
                    <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">Core Objective</span>
                  </div>
                  <p className="text-[7px] text-text-quaternary leading-relaxed">{summary.objective}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <FileText size={7} className="text-text-quaternary" />
                    <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">Architecture</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {summary.tags.map(tag => (
                      <span key={tag} className="text-[6px] px-1 py-0.5 bg-surface-frost-05 border border-border-subtle rounded text-text-quaternary">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-1.5 pt-1">
                  <button className="flex-1 py-1 px-2 border border-border-subtle bg-surface-frost-02 rounded text-[7px] font-[var(--fw-medium)] text-text-tertiary opacity-50 flex items-center justify-center space-x-1">
                    <span>Send to Linear</span>
                    <ArrowUpRight size={6} />
                  </button>
                  <button className={`flex-1 py-1 px-2 border border-border-subtle rounded text-[7px] font-[var(--fw-medium)] flex items-center justify-center space-x-1 transition-all duration-700 ${
                    sendEnabled ? 'bg-surface-frost-08 text-text-primary' : 'bg-surface-frost-02 text-text-tertiary opacity-50'
                  }`}>
                    <span>Send to Cursor</span>
                    <ArrowUpRight size={6} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppDemo() {
  const s = useTimeline(TIMELINE, LOOP_DURATION);

  const showShell = s.has('show_shell');
  const projectExpanded = s.has('expand_project');
  const showReqs = s.has('show_requirements');

  // Phase 1
  const req0Selected = s.has('select_req_0') && !s.has('select_req_1');
  const showSummaryR1 = s.has('show_summary') && !s.has('select_req_1');
  const suggestQ1 = s.has('suggest_q1');
  const suggestQ2 = s.has('suggest_q2');
  const suggestQ3 = s.has('suggest_q3');
  const acceptQ1 = s.has('accept_q1');
  const acceptQ2 = s.has('accept_q2');
  const selectQuestion = s.has('select_question') && !s.has('select_req_1');
  const showA1 = s.has('show_answer_1');
  const showA2 = s.has('show_answer_2');
  const animComp1 = s.has('animate_completeness');
  const sendEnabled = s.has('enable_send');

  // Phase 2
  const req1Selected = s.has('select_req_1');
  const showSummaryR2 = s.has('show_summary_r2');
  const suggestQ4 = s.has('suggest_q4');
  const acceptQ4 = s.has('accept_q4');
  const suggestQ5 = s.has('suggest_q5');
  const selectQuestionR2 = s.has('select_question_r2');
  const showAR2 = s.has('show_answer_r2');
  const animComp2 = s.has('animate_completeness_r2');

  const anyReqSelected = s.has('select_req_0');
  const activeReqIdx = req1Selected ? 1 : req0Selected ? 0 : -1;

  // Which questions to show
  const activeQuestions = req1Selected ? QUESTIONS_R2 : QUESTIONS_R1;
  const activeAnswers = req1Selected ? ANSWERS_R2 : ANSWERS_R1;
  const activeSummary = req1Selected ? SUMMARY_R2 : SUMMARY_R1;

  // Question visibility and states for phase 1
  const q1Visible = !req1Selected && suggestQ1;
  const q1Suggested = !req1Selected && suggestQ1 && !acceptQ1;
  const q2Visible = !req1Selected && suggestQ2;
  const q2Suggested = !req1Selected && suggestQ2 && !acceptQ2;
  const q3Visible = !req1Selected && suggestQ3;

  // Question visibility and states for phase 2
  const q4Visible = req1Selected && suggestQ4;
  const q4Suggested = req1Selected && suggestQ4 && !acceptQ4;
  const q5Visible = req1Selected && suggestQ5;

  const questionIsSelected = req1Selected ? selectQuestionR2 : selectQuestion;
  const showSummary = req1Selected ? showSummaryR2 : showSummaryR1;
  const summaryGenerating = showSummary && !(req1Selected ? animComp2 : animComp1);
  const completeness = req1Selected
    ? (animComp2 ? SUMMARY_R2.targetCompleteness : 0)
    : (animComp1 ? SUMMARY_R1.targetCompleteness : 0);

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

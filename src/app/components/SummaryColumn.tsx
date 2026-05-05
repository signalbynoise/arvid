import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { FileText, LoaderPinwheel, Loader2, ArrowUpRight, Sparkles } from 'lucide-react';
import { useStore, selectRequirements, selectQuestions, selectAnswers, selectSelectedReqId, selectSummary, selectSummaryDataState, selectProjects, selectSelectedProjectId } from '../store';
import { buildCursorPrompt, openInCursor } from '../lib/cursorDeeplink';
import { api } from '../api';
import { KnowledgeCompleteness } from './summary/KnowledgeCompleteness';
import { TaskOverview } from './summary/TaskOverview';
import { ImplementationDetails } from './summary/ImplementationDetails';
import { RulesAndConstraints } from './summary/RulesAndConstraints';
import { KnowledgeGraph } from './summary/KnowledgeGraph';
import { OpenQuestionsAndBlockers } from './summary/OpenQuestionsAndBlockers';

export function SummaryColumn() {
  const requirements = useStore(selectRequirements);
  const allQuestions = useStore(selectQuestions);
  const allAnswers = useStore(selectAnswers);
  const selectedReqId = useStore(selectSelectedReqId);
  const summary = useStore(selectSummary);
  const summaryDataState = useStore(selectSummaryDataState);
  const loadSummary = useStore(s => s.loadSummary);
  const generateSummary = useStore(s => s.generateSummary);
  const clearSummary = useStore(s => s.clearSummary);
  const projects = useStore(selectProjects);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const sendToLinear = useStore(s => s.sendToLinear);
  const sendToLinearStatus = useStore(s => s.sendToLinearStatus);
  const resetSendToLinearStatus = useStore(s => s.resetSendToLinearStatus);
  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const hasLinearProject = !!selectedProject?.linearProjectId;
  const requirement = useMemo(
    () => requirements.find(r => r.id === selectedReqId) ?? null,
    [requirements, selectedReqId],
  );
  const questions = useMemo(
    () => allQuestions.filter(q => q.requirementId === selectedReqId),
    [allQuestions, selectedReqId],
  );
  const answers = useMemo(
    () => {
      const qIds = new Set(questions.map(q => q.id));
      return allAnswers.filter(a => qIds.has(a.questionId));
    },
    [allAnswers, questions],
  );

  useEffect(() => {
    if (selectedReqId) {
      loadSummary(selectedReqId);
    } else {
      clearSummary();
    }
  }, [selectedReqId, loadSummary, clearSummary]);

  const treeFingerprint = useMemo(() => {
    const acceptedQuestions = questions.filter(q => !q.isSuggested && !q.isHidden);
    const qPart = acceptedQuestions.map(q => `${q.id}:${q.status}`).sort().join(',');
    const aPart = answers.map(a => `${a.id}:${a.isCurrent}`).sort().join(',');
    return `${qPart}|${aPart}`;
  }, [questions, answers]);

  const prevFingerprintRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasAcceptedQuestions = useMemo(
    () => questions.some(q => !q.isSuggested && !q.isHidden),
    [questions],
  );

  const isIdle = summaryDataState.status !== 'generating' && summaryDataState.status !== 'loading';

  const doGenerate = useCallback(() => {
    if (!selectedReqId || !hasAcceptedQuestions) return;
    if (summaryDataState.status === 'generating') return;
    generateSummary(selectedReqId);
  }, [selectedReqId, hasAcceptedQuestions, summaryDataState.status, generateSummary]);

  useEffect(() => {
    if (!selectedReqId || !hasAcceptedQuestions || !isIdle) return;

    if (prevFingerprintRef.current === null) {
      prevFingerprintRef.current = treeFingerprint;
      if (!summary) {
        debounceRef.current = setTimeout(doGenerate, 1500);
      }
      return;
    }

    if (treeFingerprint !== prevFingerprintRef.current) {
      prevFingerprintRef.current = treeFingerprint;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(doGenerate, 3000);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [treeFingerprint, selectedReqId, hasAcceptedQuestions, isIdle, summary, doGenerate]);

  if (!requirement) {
    return (
      <div className="w-1/4 min-w-[320px] shrink-0 h-full flex flex-col">
        <div className="p-4 border-b border-border-subtle bg-surface-panel sticky top-0 z-10">
          <h2 className="font-[var(--fw-medium)] text-text-tertiary text-[11px] tracking-widest uppercase">4. Summary</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-quaternary">
          <FileText size={32} className="mb-3 opacity-20" />
          <p className="text-[13px]">Select a requirement to view its live summary.</p>
        </div>
      </div>
    );
  }

  const missingCritical = questions.filter(q => q.status === 'Unanswered' && q.importance === 'Critical');
  const conflicts = questions.filter(q => q.status === 'Conflicting');

  const totalWeight = questions.reduce((acc, q) => acc + (q.importance === 'Critical' ? 3 : q.importance === 'Important' ? 2 : 1), 0);
  const answeredWeight = questions.filter(q => q.status === 'Answered').reduce((acc, q) => acc + (q.importance === 'Critical' ? 3 : q.importance === 'Important' ? 2 : 1), 0);
  const localCompleteness = totalWeight > 0 ? Math.round((answeredWeight / totalWeight) * 100) : 0;

  const completeness = summary?.completeness ?? localCompleteness;
  const completenessReasoning = summary?.completenessReasoning;

  const isGenerating = summaryDataState.status === 'generating';
  const isLoading = summaryDataState.status === 'loading';

  return (
    <div className="w-1/4 min-w-[320px] shrink-0 h-full flex flex-col bg-surface-panel">
      <div className="p-4 border-b border-border-subtle bg-surface-panel sticky top-0 z-10 flex items-center justify-between">
        <h2 className="font-[var(--fw-medium)] text-text-tertiary text-[11px] tracking-widest uppercase">4. Summary</h2>
        <div className="flex items-center">
          {(isGenerating || isLoading) && (
            <LoaderPinwheel size={14} className="text-text-tertiary animate-spin" />
          )}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-5">
        <div className="bg-surface-frost-02 border border-border-default rounded-panel shadow-ring overflow-hidden mb-6">
          <div className="bg-surface-frost-02 p-4 border-b border-border-subtle flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                {summary?.shortId && (
                  <span className="text-[12px] font-mono text-text-quaternary shrink-0">{summary.shortId}</span>
                )}
                <h3 className="font-[var(--fw-medium)] text-text-primary text-[16px] leading-tight tracking-[-0.165px]">{requirement.title}</h3>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <LoaderPinwheel size={12} className="text-text-tertiary" />
                <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Arvid Specification</span>
              </div>
            </div>
          </div>
          
          <div className="p-2 space-y-1">
            <KnowledgeCompleteness completeness={completeness} reasoning={completenessReasoning} />

            {summary ? (
              <>
                <TaskOverview synthesis={summary.synthesis} coreObjective={summary.coreObjective} />
                <ImplementationDetails architecture={summary.architecture} />
                <RulesAndConstraints constraints={summary.constraints} />
              </>
            ) : (
              <div className="p-4 text-center">
                <div className="flex flex-col items-center space-y-3 py-4">
                  {isGenerating ? (
                    <>
                      <Loader2 size={20} className="text-text-tertiary animate-spin" />
                      <p className="text-[13px] text-text-tertiary">Arvid is analyzing this requirement...</p>
                    </>
                  ) : summaryDataState.status === 'error' ? (
                    <>
                      <Sparkles size={20} className="text-status-error" />
                      <p className="text-[13px] text-status-error">{summaryDataState.error || 'Summary generation failed'}</p>
                      <button
                        onClick={() => selectedReqId && generateSummary(selectedReqId)}
                        className="px-3 py-1.5 bg-surface-frost-08 hover:bg-surface-frost-12 border border-border-default rounded-comfortable text-[12px] font-[var(--fw-medium)] text-text-primary transition-colors"
                      >
                        Retry
                      </button>
                    </>
                  ) : hasAcceptedQuestions ? (
                    <>
                      <Loader2 size={20} className="text-text-tertiary animate-spin" />
                      <p className="text-[13px] text-text-tertiary">Summary will generate automatically...</p>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="text-text-quaternary" />
                      <p className="text-[13px] text-text-quaternary">Accept questions to generate a summary.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <KnowledgeGraph
              requirementOwner={requirement.owner}
              questions={questions}
              answers={answers}
            />

            {summary ? (
              <OpenQuestionsAndBlockers
                unverifiedRisks={summary.unverifiedRisks}
                missingCritical={missingCritical}
                conflicts={conflicts}
              />
            ) : (
              missingCritical.length > 0 || conflicts.length > 0 ? (
                <OpenQuestionsAndBlockers
                  unverifiedRisks="Generate a summary to see AI-analyzed risks."
                  missingCritical={missingCritical}
                  conflicts={conflicts}
                />
              ) : null
            )}

            <div className="pt-4 pb-2 px-2 mt-2 flex space-x-3">
              {requirement.linearIssueUrl ? (
                <a
                  href={requirement.linearIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 border border-border-default bg-surface-panel hover:bg-surface-elevated hover:border-border-hover rounded-comfortable text-[13px] font-[var(--fw-medium)] text-text-primary transition-all duration-200 flex items-center justify-center space-x-2 shadow-subtle"
                >
                  <span>{requirement.linearIssueIdentifier || 'View in Linear'}</span>
                  <ArrowUpRight size={14} className="opacity-50" />
                </a>
              ) : (
                <button 
                  disabled={completeness < 80 || !hasLinearProject || sendToLinearStatus === 'sending'}
                  onClick={() => {
                    if (!selectedReqId) return;
                    sendToLinear(selectedReqId);
                  }}
                  className={`flex-1 py-2 px-4 border rounded-comfortable text-[13px] font-[var(--fw-medium)] transition-all duration-200 flex items-center justify-center space-x-2 shadow-subtle ${
                    completeness >= 80 && hasLinearProject
                      ? 'border-border-default bg-surface-panel hover:bg-surface-elevated hover:border-border-hover text-text-primary' 
                      : 'border-border-subtle bg-surface-frost-02 opacity-50 cursor-not-allowed text-text-tertiary'
                  }`}
                >
                  {sendToLinearStatus === 'sending' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>Send to Linear</span>
                      <ArrowUpRight size={14} className="opacity-50" />
                    </>
                  )}
                </button>
              )}
              <button 
                disabled={completeness < 80 || !summary}
                onClick={() => {
                  if (!summary) return;
                  openInCursor(buildCursorPrompt(summary, requirement.title));
                  api.notifyCursorSent(requirement.id);
                }}
                className={`flex-1 py-2 px-4 border rounded-comfortable text-[13px] font-[var(--fw-medium)] transition-all duration-200 flex items-center justify-center space-x-2 shadow-subtle ${
                  completeness >= 80 && summary
                    ? 'border-border-default bg-surface-panel hover:bg-surface-elevated hover:border-border-hover text-text-primary' 
                    : 'border-border-subtle bg-surface-frost-02 opacity-50 cursor-not-allowed text-text-tertiary'
                }`}
              >
                <span>Send to Cursor</span>
                <ArrowUpRight size={14} className="opacity-50" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { FileText, LoaderPinwheel, MoreHorizontal, BarChart3 } from 'lucide-react';
import { useStore, selectRequirements, selectQuestions, selectAnswers, selectSelectedReqId, selectSummary, selectSummaryDataState, selectProjects, selectSelectedProjectId } from '../store';
import { buildCursorPrompt, openInCursor } from '../lib/cursorDeeplink';
import { api } from '../api';
import { ColumnShell, ColumnBody, ColumnEmptyState } from './ColumnShell';
import { IconButton } from './IconButton';
import { CardShell } from './CardShell';
import { Button } from './Button';
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
      <ColumnShell title="4. Summary" borderRight={false}>
        <ColumnEmptyState
          icon={<FileText size={32} className="mb-3 opacity-20" />}
          message="Select a requirement to view its live summary."
        />
      </ColumnShell>
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

  const canSend = completeness >= 80;

  return (
    <ColumnShell
      title="4. Summary"
      borderRight={false}
      headerControls={
        <>
          {(isGenerating || isLoading) && (
            <LoaderPinwheel size={14} className="text-text-tertiary animate-spin mr-1" />
          )}
          <IconButton title="Analytics" onClick={() => {}}>
            <BarChart3 size={14} />
          </IconButton>
        </>
      }
    >
      <ColumnBody>
        <CardShell variant="default">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-tiny font-mono text-text-quaternary">
                {summary?.shortId || requirement.shortId?.replace('R', 'S') || 'S01'}
              </span>
              <MoreHorizontal size={14} className="text-text-quaternary" />
            </div>
            <h3 className="text-text-primary">{requirement.title}</h3>
          </div>

          <div className="flex flex-col">
            <KnowledgeCompleteness completeness={completeness} reasoning={completenessReasoning} />

            {summary && (
              <>
                <TaskOverview synthesis={summary.synthesis} coreObjective={summary.coreObjective} />
                <ImplementationDetails architecture={summary.architecture} />
                <RulesAndConstraints constraints={summary.constraints} />
              </>
            )}

            <KnowledgeGraph
              requirementOwner={requirement.owner}
              questions={questions}
              answers={answers}
            />

            {(summary || missingCritical.length > 0 || conflicts.length > 0) && (
              <OpenQuestionsAndBlockers
                unverifiedRisks={summary?.unverifiedRisks || 'Generate a summary to see AI-analyzed risks.'}
                missingCritical={missingCritical}
                conflicts={conflicts}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {requirement.linearIssueUrl ? (
              <Button
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => window.open(requirement.linearIssueUrl, '_blank')}
              >
                <img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />
                <span>{requirement.linearIssueIdentifier || 'View in Linear'}</span>
              </Button>
            ) : (
              <Button
                className="flex-1 flex items-center justify-center gap-2"
                disabled={!canSend || !hasLinearProject || sendToLinearStatus === 'sending'}
                onClick={() => selectedReqId && sendToLinear(selectedReqId)}
              >
                <img src="/linear.svg" alt="" className="w-4 h-4 opacity-60" />
                <span>Send to Linear</span>
              </Button>
            )}
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              disabled={!canSend || !summary}
              onClick={() => {
                if (!summary) return;
                openInCursor(buildCursorPrompt(summary, requirement.title));
                api.notifyCursorSent(requirement.id);
              }}
            >
              <img src="/cursor.svg" alt="" className="w-4 h-4 opacity-60" />
              <span>Send to Cursor</span>
            </Button>
          </div>
        </CardShell>
      </ColumnBody>
    </ColumnShell>
  );
}

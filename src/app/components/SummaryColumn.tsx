import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, LoaderPinwheel, MoreHorizontal } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore, selectRequirements, selectQuestions, selectAnswers, selectSelectedReqId, selectSummary, selectSummaryDataState, selectProjects, selectSelectedProjectId } from '../store';
import { buildCursorPrompt, openInCursor } from '../lib/cursorDeeplink';
import { buildRequirementPath } from '../domain/paths';
import { api } from '../api';
import { ColumnShell, ColumnBody, ColumnEmptyState } from './ColumnShell';
import { Card } from './ui/Card';
import { KnowledgeCompleteness } from './summary/KnowledgeCompleteness';
import { TaskOverview } from './summary/TaskOverview';
import { ImplementationDetails } from './summary/ImplementationDetails';
import { RulesAndConstraints } from './summary/RulesAndConstraints';
import { KnowledgeGraph } from './summary/KnowledgeGraph';
import { OpenQuestionsAndBlockers } from './summary/OpenQuestionsAndBlockers';
import { SummaryMenu } from './summary/SummaryMenu';
import { EmailRequirementModal } from './summary/EmailRequirementModal';

export function SummaryColumn() {
  const { wsShortId, teamShortId, projectShortId } = useParams();
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
  const autoCreateLinearIssue = useStore(s => s.autoCreateLinearIssue);
  const autoSyncLinearIssue = useStore(s => s.autoSyncLinearIssue);
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

  const [figmaUrls, setFigmaUrls] = useState<string[]>([]);
  const autoCreateInFlightRef = useRef<string | null>(null);
  const lastSyncedAtRef = useRef<string | null>(null);

  useEffect(() => {
    autoCreateInFlightRef.current = null;
    lastSyncedAtRef.current = null;

    if (selectedReqId) {
      loadSummary(selectedReqId);
      api.getRequirementFigmaLinks(selectedReqId)
        .then(links => setFigmaUrls(links.map(l => l.figmaUrl)))
        .catch(() => setFigmaUrls([]));
    } else {
      clearSummary();
      setFigmaUrls([]);
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

  const isImplemented = requirement?.implStatus === 'Implemented';

  const doGenerate = useCallback(() => {
    if (!selectedReqId || !hasAcceptedQuestions || isImplemented) return;
    if (summaryDataState.status === 'generating') return;
    generateSummary(selectedReqId);
  }, [selectedReqId, hasAcceptedQuestions, isImplemented, summaryDataState.status, generateSummary]);

  useEffect(() => {
    if (!selectedReqId || !hasAcceptedQuestions || !isIdle || isImplemented) return;

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
  }, [treeFingerprint, selectedReqId, hasAcceptedQuestions, isIdle, isImplemented, summary, doGenerate]);

  useEffect(() => {
    if (!summary || !hasLinearProject || !requirement || !selectedReqId) return;
    if (summary.completeness < 80) return;

    if (!requirement.linearIssueId) {
      if (autoCreateInFlightRef.current === selectedReqId) return;
      autoCreateInFlightRef.current = selectedReqId;
      autoCreateLinearIssue(selectedReqId);
      return;
    }

    const generatedAt = summary.generatedAt ?? null;
    if (generatedAt && generatedAt !== lastSyncedAtRef.current) {
      lastSyncedAtRef.current = generatedAt;
      autoSyncLinearIssue(selectedReqId);
    }
  }, [summary, hasLinearProject, requirement, selectedReqId, autoCreateLinearIssue, autoSyncLinearIssue]);

  if (!requirement) {
    return (
      <ColumnShell title="Summary" borderRight={false}>
        <ColumnEmptyState
          icon={<FileText size={ICON_SIZE['2xl']} className="mb-3 opacity-20" />}
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

  const handleSendToLinear = useCallback(() => {
    if (requirement?.linearIssueUrl) {
      window.open(requirement.linearIssueUrl, '_blank');
      return;
    }
    if (selectedReqId) sendToLinear(selectedReqId);
  }, [requirement, selectedReqId, sendToLinear]);

  const handleSendToCursor = useCallback(() => {
    if (!summary || !requirement) return;
    const linearIssue = requirement.linearIssueIdentifier && requirement.linearIssueUrl
      ? { identifier: requirement.linearIssueIdentifier, url: requirement.linearIssueUrl }
      : undefined;
    openInCursor(buildCursorPrompt(summary, requirement.title, figmaUrls.length > 0 ? figmaUrls : undefined, linearIssue));
    api.notifyCursorSent(requirement.id);
  }, [summary, requirement, figmaUrls]);

  const handleCopyRequirementLink = useCallback(() => {
    if (!requirement?.shortId || !wsShortId || !teamShortId || !projectShortId) return;
    const path = buildRequirementPath(wsShortId, teamShortId, projectShortId, requirement.shortId);
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
  }, [requirement, wsShortId, teamShortId, projectShortId]);

  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const requirementUrl = useMemo(() => {
    if (!requirement?.shortId || !wsShortId || !teamShortId || !projectShortId) return '';
    const path = buildRequirementPath(wsShortId, teamShortId, projectShortId, requirement.shortId);
    return `${window.location.origin}${path}`;
  }, [requirement, wsShortId, teamShortId, projectShortId]);

  return (
    <ColumnShell
      title="Summary"
      borderRight={false}
      headerControls={
        <>
          {(isGenerating || isLoading) && (
            <LoaderPinwheel size={ICON_SIZE.sm} className="text-text-tertiary animate-spin mr-1" />
          )}
          <SummaryMenu
            onSendToLinear={handleSendToLinear}
            onSendToCursor={handleSendToCursor}
            onDashboard={() => {}}
            onGraph={() => {}}
            onEmailRequirementLink={() => setEmailModalOpen(true)}
            onCopyRequirementLink={handleCopyRequirementLink}
            linearDisabled={!canSend || !hasLinearProject || sendToLinearStatus === 'sending'}
            cursorDisabled={!canSend || !summary}
            linearLabel={requirement.linearIssueUrl ? (requirement.linearIssueIdentifier || 'View in Linear') : 'Send to Linear'}
          />
        </>
      }
    >
      <ColumnBody>
        <Card variant="default">
          <div className="flex flex-col gap-2">
            <Card.Header
              shortId={summary?.shortId || requirement.shortId?.replace('R', 'S') || 'S01'}
              actions={<MoreHorizontal size={ICON_SIZE.sm} className="text-text-quaternary" />}
            />
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
        </Card>
      </ColumnBody>

      <EmailRequirementModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        requirementUrl={requirementUrl}
        requirementTitle={requirement.title}
      />
    </ColumnShell>
  );
}

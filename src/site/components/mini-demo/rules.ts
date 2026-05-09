import type { DemoState, Rule, ContentPool, Transition } from './types';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnused(pool: Array<{ id: string }>, used: string[]): { id: string } | null {
  const available = pool.filter(item => !used.includes(item.id));
  return available.length > 0 ? pick(available) : null;
}

export function browsRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => !s.browsed && s.requirements.length > 0,
    execute: (s) => ({
      actor,
      verb: 'browse',
      subject: 'requirements',
      stateUpdate: (prev) => ({ ...prev, browsed: true }),
    }),
  };
}

export function openImportModalRule(actor: string, maxImports = 3): Rule {
  return {
    actor,
    weight: 3,
    canExecute: (s) => {
      const initialCount = 2;
      const addedCount = s.requirements.length - initialCount;
      if (addedCount >= maxImports) return false;
      return s.browsed && !s.selectedRequirement && !s.modalPhase;
    },
    execute: () => ({
      actor,
      verb: 'open',
      subject: 'import-modal',
      stateUpdate: (prev) => ({ ...prev, modalPhase: 'open' }),
    }),
  };
}

export function startImportRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'open',
    execute: () => ({
      actor,
      verb: 'import',
      subject: 'slack',
      stateUpdate: (prev) => ({ ...prev, modalPhase: 'importing' }),
    }),
  };
}

export function extractRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'importing',
    execute: () => ({
      actor,
      verb: 'extract',
      subject: 'slack',
      stateUpdate: (prev) => ({ ...prev, modalPhase: 'extracting' }),
    }),
  };
}

export function showSuggestionsRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'extracting',
    execute: () => ({
      actor,
      verb: 'suggest',
      subject: 'slack-results',
      stateUpdate: (prev) => ({ ...prev, modalPhase: 'suggestions' }),
    }),
  };
}

export function selectSuggestionRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'suggestions',
    execute: (s, pool) => {
      const suggestion = pool.slackSuggestions?.[0];
      const newReqId = suggestion?.id ?? `imported-${s.cycleCount}`;
      return {
        actor,
        verb: 'select',
        subject: newReqId,
        stateUpdate: (prev) => ({
          ...prev,
          modalPhase: 'selected',
          requirements: [...prev.requirements, newReqId],
        }),
      };
    },
  };
}

export function closeModalRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'selected',
    execute: () => ({
      actor,
      verb: 'close',
      subject: 'modal',
      stateUpdate: (prev) => ({ ...prev, modalPhase: null, imported: true }),
    }),
  };
}

export function selectRequirementRule(actor: string): Rule {
  return {
    actor,
    weight: 2,
    canExecute: (s) => s.requirements.length > 0 && !s.selectedRequirement && !s.modalPhase,
    execute: (s) => {
      const reqId = pick(s.requirements);
      return {
        actor,
        verb: 'select',
        subject: reqId,
        stateUpdate: (prev) => ({ ...prev, selectedRequirement: reqId }),
      };
    },
  };
}

export function generateQuestionsRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => {
      if (!s.selectedRequirement) return false;
      const existing = s.questions[s.selectedRequirement] ?? [];
      return existing.length === 0;
    },
    execute: (s, pool) => {
      const reqId = s.selectedRequirement!;
      const available = pool.questions[reqId] ?? Object.values(pool.questions)[0] ?? [];
      const count = Math.min(available.length, 2 + Math.floor(Math.random() * 4), 5);
      const questionIds = available.slice(0, count).map(q => q.id);
      return {
        actor,
        verb: 'generate',
        subject: `questions-for-${reqId}`,
        stateUpdate: (prev) => ({
          ...prev,
          questions: { ...prev.questions, [reqId]: questionIds },
        }),
      };
    },
  };
}

export function acceptQuestionRule(actor: string, maxAccepts = 3): Rule {
  return {
    actor,
    canExecute: (s) => {
      if (!s.selectedRequirement) return false;
      if (s.acceptedQuestions.length >= maxAccepts) return false;
      const qIds = s.questions[s.selectedRequirement] ?? [];
      return qIds.some(id => !s.acceptedQuestions.includes(id));
    },
    execute: (s) => {
      const qIds = s.questions[s.selectedRequirement!] ?? [];
      const unaccepted = qIds.filter(id => !s.acceptedQuestions.includes(id));
      const qId = pick(unaccepted);
      return {
        actor,
        verb: 'accept',
        subject: qId,
        stateUpdate: (prev) => ({
          ...prev,
          acceptedQuestions: [...prev.acceptedQuestions, qId],
        }),
      };
    },
  };
}

export function selectQuestionRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.acceptedQuestions.length > 0 && !s.selectedQuestion,
    execute: (s) => {
      const qId = pick(s.acceptedQuestions);
      return {
        actor,
        verb: 'select',
        subject: qId,
        stateUpdate: (prev) => ({ ...prev, selectedQuestion: qId }),
      };
    },
  };
}

export function answerQuestionRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => {
      if (!s.selectedQuestion) return false;
      const existing = s.answers[s.selectedQuestion] ?? [];
      return existing.length === 0;
    },
    execute: (s, pool) => {
      const qId = s.selectedQuestion!;
      const available = Object.values(pool.answers).flat();
      const answer = available.length > 0 ? pick(available) : { id: `a-${qId}` };
      return {
        actor,
        verb: 'answer',
        subject: answer.id as string,
        stateUpdate: (prev) => ({
          ...prev,
          answers: { ...prev.answers, [qId]: [...(prev.answers[qId] ?? []), answer.id as string] },
          completeness: Math.min(95, prev.completeness + 10 + Math.floor(Math.random() * 15)),
        }),
      };
    },
  };
}

export function generateSummaryRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => !!s.selectedRequirement && !s.summaryGenerated,
    execute: () => ({
      actor,
      verb: 'generate',
      subject: 'summary',
      stateUpdate: (prev) => ({ ...prev, summaryGenerated: true, completeness: 10 + Math.floor(Math.random() * 30) }),
    }),
  };
}

export function exportToLinearRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.completeness > 0 && !s.exports.includes('linear'),
    execute: () => ({
      actor,
      verb: 'export',
      subject: 'linear',
      stateUpdate: (prev) => ({ ...prev, exports: [...prev.exports, 'linear'] }),
    }),
  };
}

export function exportToCursorRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.exports.includes('linear') && !s.exports.includes('cursor'),
    execute: () => ({
      actor,
      verb: 'export',
      subject: 'cursor',
      stateUpdate: (prev) => ({ ...prev, exports: [...prev.exports, 'cursor'] }),
    }),
  };
}

export function browseQuestionsRule(actor: string): Rule {
  return {
    actor,
    canExecute: () => false,
    execute: () => ({
      actor,
      verb: 'browse',
      subject: 'questions',
      stateUpdate: (prev) => prev,
    }),
  };
}

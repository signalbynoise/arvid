import type { Direction, ContentPool, Rule, DemoState } from '../mini-demo/types';
import {
  selectRequirementRule,
  generateQuestionsRule,
  browseQuestionsRule,
  acceptQuestionRule,
} from '../mini-demo/rules';

const SARAH = { id: 'sarah', name: 'Sarah K.' };
const ARVID = { id: 'arvid', name: 'Arvid' };

function connectRepoOpenRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => !s.browsed && s.requirements.length === 0,
    execute: () => ({
      actor,
      verb: 'open',
      subject: 'repo-selector',
      stateUpdate: (prev) => ({ ...prev, modalPhase: 'open' }),
    }),
  };
}

function connectRepoSelectRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'open',
    execute: () => ({
      actor,
      verb: 'select',
      subject: 'repo',
      stateUpdate: (prev) => ({ ...prev, modalPhase: 'importing' }),
    }),
  };
}

function connectRepoFetchRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'importing',
    execute: () => ({
      actor,
      verb: 'fetch',
      subject: 'codebase',
      stateUpdate: (prev) => ({ ...prev, modalPhase: 'extracting' }),
    }),
  };
}

function connectRepoDoneRule(actor: string): Rule {
  return {
    actor,
    canExecute: (s) => s.modalPhase === 'extracting',
    execute: (s, pool) => {
      const reqIds = pool.requirements.slice(0, 2).map(r => r.id);
      return {
        actor,
        verb: 'generate',
        subject: 'requirements-from-code',
        stateUpdate: (prev) => ({
          ...prev,
          modalPhase: null,
          requirements: reqIds,
          browsed: true,
        }),
      };
    },
  };
}

const contentPool: ContentPool = {
  requirements: [
    { id: 'r1', shortId: 'R01', title: 'Post-Login OAuth Profile Refresh', owner: 'Erik L.', createdAt: 'May 1', completeness: 55, clarity: 'Medium', risk: 'Low' },
    { id: 'r2', shortId: 'R02', title: 'GitHub OAuth & Repository Analysis', owner: 'Erik L.', createdAt: 'Apr 28', completeness: 100, clarity: 'High', risk: 'Low' },
  ],
  questions: {
    _default: [
      { id: 'q1', shortId: 'Q01', text: 'How should the system detect a successful login to trigger the refresh?', status: 'Unanswered', importance: 'Critical', category: 'Auth', author: 'Arvid', createdAt: 'May 2' },
      { id: 'q2', shortId: 'Q02', text: 'What specific profile fields from GitHub should be synced?', status: 'Unanswered', importance: 'Important', category: 'Data', author: 'Arvid', createdAt: 'May 2' },
      { id: 'q3', shortId: 'Q03', text: 'How does the system determine which provider to query?', status: 'Unanswered', importance: 'Important', category: 'Auth', author: 'Arvid', createdAt: 'May 3' },
    ],
  },
  answers: {
    _default: [],
  },
};

export const githubDirection: Direction = {
  goal: (s) => s.acceptedQuestions.length >= 2,

  actors: [SARAH, ARVID],

  rules: [
    connectRepoOpenRule(SARAH.id),
    connectRepoSelectRule(SARAH.id),
    connectRepoFetchRule(ARVID.id),
    connectRepoDoneRule(ARVID.id),
    selectRequirementRule(SARAH.id),
    generateQuestionsRule(ARVID.id),
    browseQuestionsRule(SARAH.id),
    acceptQuestionRule(SARAH.id),
    acceptQuestionRule(SARAH.id),
  ],

  contentPool,
};

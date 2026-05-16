import type { Direction, ContentPool } from '../mini-demo/types';
import {
  selectRequirementRule,
  generateQuestionsRule,
  acceptQuestionRule,
  selectQuestionRule,
  answerQuestionRule,
} from '../mini-demo/rules';

import { ARVID, PRIYA } from '../mini-demo/actors';

const contentPool: ContentPool = {
  requirements: [
    { id: 'ag-r1', shortId: 'R01', title: 'User authentication with SSO support', owner: 'Sarah K.', createdAt: 'May 1', completeness: 72, clarity: 'High', risk: 'Low', status: 'In progress', implStatus: 'Implemented', deployStatus: 'Live' },
    { id: 'ag-r2', shortId: 'R02', title: 'Real-time notifications system', owner: 'James L.', createdAt: 'Apr 29', completeness: 45, clarity: 'Medium', risk: 'Medium', status: 'In progress', implStatus: 'Partially implemented', deployStatus: 'Not deployed' },
    { id: 'ag-r3', shortId: 'R03', title: 'API rate limiting for public endpoints', owner: 'David M.', createdAt: 'Apr 25', completeness: 30, clarity: 'Medium', risk: 'High', status: 'Pre backlog', implStatus: 'Not implemented' },
  ],
  questions: {
    _default: [
      { id: 'agq1', shortId: 'Q01', text: 'What session token format should the auth service use?', status: 'Unanswered', importance: 'Critical', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
      { id: 'agq2', shortId: 'Q02', text: 'Should the notification service use WebSockets or SSE?', status: 'Unanswered', importance: 'Important', category: 'Architecture', author: 'Arvid', createdAt: 'Today' },
      { id: 'agq3', shortId: 'Q03', text: 'Where should rate limit counters be stored?', status: 'Unanswered', importance: 'Critical', category: 'Infrastructure', author: 'Arvid', createdAt: 'Today' },
      { id: 'agq4', shortId: 'Q04', text: 'What retry strategy for failed notification delivery?', status: 'Unanswered', importance: 'Important', category: 'Reliability', author: 'Arvid', createdAt: 'Today' },
    ],
  },
  answers: {
    _default: [
      { id: 'aga1', shortId: 'A01', author: 'David M.', createdAt: 'Today', text: 'JWT with short-lived access tokens and rotating refresh tokens stored in httpOnly cookies.', isCurrent: true },
      { id: 'aga2', shortId: 'A02', author: 'David M.', createdAt: 'Today', text: 'WebSockets for real-time, with SSE fallback for environments that block WS.', isCurrent: true },
    ],
  },
};

export const agentsDirection: Direction = {
  goal: (s) => s.acceptedQuestions.length >= 2 && Object.values(s.answers).some(answerIds => answerIds.length > 0),

  actors: [PRIYA, ARVID],

  rules: [
    selectRequirementRule(PRIYA.id),
    generateQuestionsRule(ARVID.id),
    acceptQuestionRule(PRIYA.id, 2),
    selectQuestionRule(PRIYA.id),
    answerQuestionRule(PRIYA.id),
  ],

  contentPool,

  initialState: {
    requirements: contentPool.requirements.map(r => r.id),
    browsed: true,
    imported: true,
  },
};

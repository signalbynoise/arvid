import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/requireAuth';
import { requirementsRouter } from './routes/requirements';
import { questionsRouter } from './routes/questions';
import { answersRouter } from './routes/answers';
import { projectsRouter } from './routes/projects';
import { summariesRouter } from './routes/summaries';
import { githubRouter, githubCallbackRouter } from './routes/github';
import { linearRouter, linearCallbackRouter } from './routes/linear';
import { slackRouter, slackCallbackRouter } from './routes/slack';
import { webhooksRouter } from './routes/webhooks';
import { workspacesRouter } from './routes/workspaces';
import { teamsRouter } from './routes/teams';
import { membershipsRouter } from './routes/memberships';
import { invitationsRouter } from './routes/invitations';
import { teamMembershipsRouter } from './routes/teamMemberships';
import { projectMembershipsRouter } from './routes/projectMemberships';
import { cardAssigneesRouter } from './routes/cardAssignees';
import { supabaseConnectRouter, supabaseConnectCallbackRouter } from './routes/supabaseConnect';
import { articlesPublicRouter } from './routes/articles';
import { cmsArticlesRouter } from './routes/cmsArticles';
import { documentsRouter } from './routes/documents';
import { figmaRouter, figmaCallbackRouter } from './routes/figma';
import { billingRouter } from './routes/billing';
import { stripeWebhooksRouter } from './routes/stripeWebhooks';
import { searchRouter } from './routes/search';
import { renderRouter } from './routes/render';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  process.env.SITE_ORIGIN,
  process.env.APP_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean) as string[];

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

app.use('/api/webhooks', express.json({
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use('/api/webhooks', webhooksRouter);
app.use('/api/webhooks', stripeWebhooksRouter);

app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/github/callback', githubCallbackRouter);
app.use('/api/linear/callback', linearCallbackRouter);
app.use('/api/slack/callback', slackCallbackRouter);
app.use('/api/supabase-connect/callback', supabaseConnectCallbackRouter);
app.use('/api/figma/callback', figmaCallbackRouter);
app.use('/api/articles', articlesPublicRouter);

app.use('/api', requireAuth);

app.use('/api/workspaces', workspacesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/memberships', membershipsRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/team-memberships', teamMembershipsRouter);
app.use('/api/project-memberships', projectMembershipsRouter);
app.use('/api/requirements', requirementsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter);
app.use('/api/card-assignees', cardAssigneesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/summaries', summariesRouter);
app.use('/api/github', githubRouter);
app.use('/api/linear', linearRouter);
app.use('/api/slack', slackRouter);
app.use('/api/supabase-connect', supabaseConnectRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/figma', figmaRouter);
app.use('/api/cms/articles', cmsArticlesRouter);
app.use('/api/billing', billingRouter);
app.use('/api/search', searchRouter);
app.use('/api/render', renderRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR] [express:unhandled]', err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`BFF server running on http://0.0.0.0:${PORT}`);
});

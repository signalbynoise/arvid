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

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  process.env.SITE_ORIGIN,
  process.env.APP_ORIGIN,
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

app.use('/api/webhooks', express.json({
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use('/api/webhooks', webhooksRouter);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/github/callback', githubCallbackRouter);
app.use('/api/linear/callback', linearCallbackRouter);
app.use('/api/slack/callback', slackCallbackRouter);

app.use('/api', requireAuth);

app.use('/api/requirements', requirementsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/summaries', summariesRouter);
app.use('/api/github', githubRouter);
app.use('/api/linear', linearRouter);
app.use('/api/slack', slackRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`BFF server running on http://0.0.0.0:${PORT}`);
});

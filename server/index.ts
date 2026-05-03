import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/requireAuth';
import { requirementsRouter } from './routes/requirements';
import { questionsRouter } from './routes/questions';
import { answersRouter } from './routes/answers';
import { projectsRouter } from './routes/projects';
import { summariesRouter } from './routes/summaries';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  process.env.SITE_ORIGIN,
  process.env.APP_ORIGIN,
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', requireAuth);

app.use('/api/requirements', requirementsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/summaries', summariesRouter);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`BFF server running on http://0.0.0.0:${PORT}`);
});

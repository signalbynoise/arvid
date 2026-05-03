import express from 'express';
import cors from 'cors';
import { requirementsRouter } from './routes/requirements';
import { questionsRouter } from './routes/questions';
import { answersRouter } from './routes/answers';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/requirements', requirementsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/answers', answersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`BFF server running on http://0.0.0.0:${PORT}`);
});

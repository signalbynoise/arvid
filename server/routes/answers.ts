import { Router } from 'express';
import { createUserClient } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateAnswerBodySchema, UpdateAnswerBodySchema } from '../../shared/schemas';
import { suggestAnswer } from '../openrouter';
import { fetchRequirementContext } from '../context';
import { nextShortId } from '../lib/shortId';
import { sendSlackNotification } from '../lib/slackNotifier';

export const answersRouter = Router();

answersRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  let query = db
    .from('answers')
    .select('*')
    .order('date', { ascending: true });

  if (req.query.question_id) {
    query = query.eq('question_id', req.query.question_id as string);
  }

  if (req.query.include_deactivated !== 'true') {
    query = query.eq('is_deactivated', false);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

answersRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('answers')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

answersRouter.post('/', validateBody(CreateAnswerBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const shortId = await nextShortId(db, 'answers', 'A', 'question_id', req.body.question_id);
  const { data, error } = await db
    .from('answers')
    .insert({ ...req.body, short_id: shortId, created_by: req.user!.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const { data: question } = await db
    .from('questions')
    .select('text, requirement_id')
    .eq('id', req.body.question_id)
    .single();

  if (question?.requirement_id) {
    const { data: requirement } = await db
      .from('requirements')
      .select('project_id')
      .eq('id', question.requirement_id)
      .single();

    if (requirement?.project_id) {
      sendSlackNotification({
        projectId: requirement.project_id,
        eventType: 'question_answered',
        title: question.text,
        summary: `Answer: ${data.text.slice(0, 200)}${data.text.length > 200 ? '...' : ''}`,
        entityId: data.id,
        db,
      });
    }
  }

  res.status(201).json(data);
});

answersRouter.post('/suggest/:questionId', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { questionId } = req.params;

  console.info(
    '[INFO] [answers:suggest] Generating suggested answer',
    JSON.stringify({ questionId }),
  );

  const { data: question, error: qError } = await db
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (qError || !question) {
    console.error(
      '[ERROR] [answers:suggest] Question not found',
      JSON.stringify({ questionId, error: qError?.message }),
    );
    return res.status(404).json({ error: `Question ${questionId} not found` });
  }

  const context = await fetchRequirementContext(db, question.requirement_id);

  if (!context) {
    console.error(
      '[ERROR] [answers:suggest] Requirement context not found',
      JSON.stringify({ questionId, requirementId: question.requirement_id }),
    );
    return res.status(404).json({ error: `Requirement for question ${questionId} not found` });
  }

  try {
    const result = await suggestAnswer({
      questionText: question.text,
      requirementTitle: context.requirement.title,
      requirementDescription: context.requirement.description,
      projectName: context.projectName,
      existingQuestions: context.questions.map(q => ({
        text: q.text,
        status: q.status,
        importance: q.importance,
        category: q.category,
        answers: q.answers.map(a => ({ text: a.text, author: a.author })),
      })),
      repoContext: context.repoContext,
      repoFileTree: context.repoFileTree,
      repoKeyFiles: context.repoKeyFiles,
      repoRecentCommits: context.repoRecentCommits,
      dbContext: context.dbContext,
    });

    if (!result.answerable || !result.answer_text) {
      console.info(
        '[INFO] [answers:suggest] Question requires human answer',
        JSON.stringify({ questionId, reasoning: result.reasoning }),
      );
      return res.json({ skipped: true, reasoning: result.reasoning });
    }

    const answerId = `as-${questionId}-${Date.now()}`;
    const shortId = await nextShortId(db, 'answers', 'A', 'question_id', questionId);
    const { data: inserted, error: insertError } = await db
      .from('answers')
      .insert({
        id: answerId,
        question_id: questionId,
        short_id: shortId,
        text: result.answer_text,
        author: 'Arvid',
        date: new Date().toISOString(),
        is_current: false,
        is_suggested: true,
        is_hidden: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        '[ERROR] [answers:suggest] Failed to insert suggested answer',
        JSON.stringify({ questionId, error: insertError.message }),
      );
      return res.status(500).json({ error: insertError.message });
    }

    console.info(
      '[INFO] [answers:suggest] Suggested answer created',
      JSON.stringify({ questionId, answerId: inserted.id, confidence: result.confidence }),
    );

    res.status(201).json(inserted);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [answers:suggest] Generation failed',
      JSON.stringify({ questionId, error: message }),
    );
    res.status(500).json({ error: `Answer suggestion failed: ${message}` });
  }
});

answersRouter.patch('/:id', validateBody(UpdateAnswerBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('answers')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

answersRouter.patch('/:id/deactivate', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('answers')
    .update({ is_deactivated: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

answersRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { error } = await db
    .from('answers')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

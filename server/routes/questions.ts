import { Router } from 'express';
import { createUserClient } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateQuestionBodySchema, UpdateQuestionBodySchema } from '../../shared/schemas';
import { suggestQuestions, classifyQuestion } from '../openrouter';
import { fetchRequirementContext } from '../context';
import { nextShortId, formatShortId } from '../lib/shortId';

export const questionsRouter = Router();

questionsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  let query = db
    .from('questions')
    .select('*')
    .order('created_at', { ascending: true });

  if (req.query.requirement_id) {
    query = query.eq('requirement_id', req.query.requirement_id as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

questionsRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('questions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

questionsRouter.post('/', validateBody(CreateQuestionBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const shortId = await nextShortId(db, 'questions', 'Q', 'requirement_id', req.body.requirement_id);
  const { data, error } = await db
    .from('questions')
    .insert({ ...req.body, short_id: shortId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

questionsRouter.post('/classify', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { text, requirement_id } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!requirement_id) {
    return res.status(400).json({ error: 'requirement_id is required' });
  }

  const fullContext = await fetchRequirementContext(db, requirement_id);

  const classifyContext = fullContext ? {
    requirement: fullContext.requirement,
    projectName: fullContext.projectName,
    siblingRequirements: fullContext.siblingRequirements,
    existingQuestions: fullContext.questions.map(q => ({
      text: q.text,
      status: q.status,
      importance: q.importance,
      category: q.category,
      answers: q.answers.map(a => ({ text: a.text, author: a.author })),
    })),
    repoContext: fullContext.repoContext,
  } : null;

  try {
    const result = await classifyQuestion(text.trim(), classifyContext);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [questions:classify] Classification failed', JSON.stringify({ error: message }));
    res.json({ importance: 'Important', category: 'Scope' });
  }
});

questionsRouter.post('/suggest/:requirementId', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { requirementId } = req.params;

  console.info(
    '[INFO] [questions:suggest] Generating suggested questions',
    JSON.stringify({ requirementId }),
  );

  const context = await fetchRequirementContext(db, requirementId);

  if (!context) {
    return res.status(404).json({ error: `Requirement ${requirementId} not found` });
  }

  try {
    const suggestions = await suggestQuestions({
      requirementTitle: context.requirement.title,
      requirementDescription: context.requirement.description,
      projectName: context.projectName,
      existingRequirements: context.siblingRequirements,
      existingQuestions: context.questions.map(q => ({
        text: q.text,
        status: q.status,
        importance: q.importance,
        category: q.category,
        answers: q.answers.map(a => ({ text: a.text, author: a.author })),
      })),
      repoContext: context.repoContext,
    });

    const { count: existingCount } = await db
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('requirement_id', requirementId);

    const baseCount = existingCount ?? 0;

    const rows = suggestions.map((s, i) => ({
      id: `qs-${requirementId}-${Date.now()}-${i}`,
      requirement_id: requirementId,
      short_id: formatShortId('Q', baseCount + i),
      text: s.text,
      importance: s.importance,
      category: s.category,
      status: 'Unanswered',
      type: 'Auto-generated',
      is_suggested: true,
      is_hidden: false,
      author: 'Arvid',
      author_team: 'Arvid',
      created_at: new Date().toISOString().split('T')[0],
    }));

    const { data: inserted, error: insertError } = await db
      .from('questions')
      .insert(rows)
      .select();

    if (insertError) {
      console.error(
        '[ERROR] [questions:suggest] Failed to insert suggestions',
        JSON.stringify({ error: insertError.message }),
      );
      return res.status(500).json({ error: insertError.message });
    }

    console.info(
      '[INFO] [questions:suggest] Suggestions created',
      JSON.stringify({ requirementId, count: inserted?.length }),
    );

    res.status(201).json(inserted);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [questions:suggest] Generation failed',
      JSON.stringify({ requirementId, error: message }),
    );
    res.status(500).json({ error: `Suggestion generation failed: ${message}` });
  }
});

questionsRouter.patch('/:id', validateBody(UpdateQuestionBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('questions')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

questionsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { error } = await db
    .from('questions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

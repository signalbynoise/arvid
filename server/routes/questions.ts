import { Router } from 'express';
import { supabase } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateQuestionBodySchema, UpdateQuestionBodySchema } from '../../shared/schemas';
import { suggestQuestions, classifyQuestion } from '../openrouter';
import { fetchRequirementContext } from '../context';

export const questionsRouter = Router();

questionsRouter.get('/', async (req, res) => {
  let query = supabase
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
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

questionsRouter.post('/', validateBody(CreateQuestionBodySchema), async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .insert(req.body)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

questionsRouter.post('/classify', async (req, res) => {
  const { text, requirement_id } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!requirement_id) {
    return res.status(400).json({ error: 'requirement_id is required' });
  }

  const { data: requirement } = await supabase
    .from('requirements')
    .select('title, description')
    .eq('id', requirement_id)
    .single();

  try {
    const result = await classifyQuestion(
      text.trim(),
      requirement?.title,
      requirement?.description ?? undefined,
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [questions:classify] Classification failed', JSON.stringify({ error: message }));
    res.json({ importance: 'Important', category: 'Scope' });
  }
});

questionsRouter.post('/suggest/:requirementId', async (req, res) => {
  const { requirementId } = req.params;

  console.info(
    '[INFO] [questions:suggest] Generating suggested questions',
    JSON.stringify({ requirementId }),
  );

  const context = await fetchRequirementContext(requirementId);

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
    });

    const rows = suggestions.map((s, i) => ({
      id: `qs-${requirementId}-${Date.now()}-${i}`,
      requirement_id: requirementId,
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

    const { data: inserted, error: insertError } = await supabase
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
  const { data, error } = await supabase
    .from('questions')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

questionsRouter.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

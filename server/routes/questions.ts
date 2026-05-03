import { Router } from 'express';
import { supabase } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateQuestionBodySchema, UpdateQuestionBodySchema } from '../../shared/schemas';

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

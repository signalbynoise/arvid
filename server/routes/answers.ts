import { Router } from 'express';
import { supabase } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateAnswerBodySchema, UpdateAnswerBodySchema } from '../../shared/schemas';

export const answersRouter = Router();

answersRouter.get('/', async (req, res) => {
  let query = supabase
    .from('answers')
    .select('*')
    .order('date', { ascending: true });

  if (req.query.question_id) {
    query = query.eq('question_id', req.query.question_id as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

answersRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

answersRouter.post('/', validateBody(CreateAnswerBodySchema), async (req, res) => {
  const { data, error } = await supabase
    .from('answers')
    .insert(req.body)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

answersRouter.patch('/:id', validateBody(UpdateAnswerBodySchema), async (req, res) => {
  const { data, error } = await supabase
    .from('answers')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

answersRouter.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('answers')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

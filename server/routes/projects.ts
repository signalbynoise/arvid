import { Router } from 'express';
import { supabase } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateProjectBodySchema, UpdateProjectBodySchema } from '../../shared/schemas';

export const projectsRouter = Router();

projectsRouter.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

projectsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

projectsRouter.post('/', validateBody(CreateProjectBodySchema), async (req, res) => {
  const body = {
    ...req.body,
    id: req.body.id || `p${Date.now()}`,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(body)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

projectsRouter.patch('/:id', validateBody(UpdateProjectBodySchema), async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

projectsRouter.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

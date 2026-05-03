import { Router } from 'express';
import { supabase } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateRequirementBodySchema, UpdateRequirementBodySchema } from '../../shared/schemas';
import { enhanceRequirement } from '../openrouter';

export const requirementsRouter = Router();

requirementsRouter.get('/', async (req, res) => {
  let query = supabase
    .from('requirements')
    .select('*')
    .order('created_at', { ascending: true });

  if (req.query.project_id) {
    query = query.eq('project_id', req.query.project_id as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

requirementsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('requirements')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

requirementsRouter.post('/', validateBody(CreateRequirementBodySchema), async (req, res) => {
  const { data, error } = await supabase
    .from('requirements')
    .insert(req.body)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

requirementsRouter.patch('/:id', validateBody(UpdateRequirementBodySchema), async (req, res) => {
  const { data, error } = await supabase
    .from('requirements')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

requirementsRouter.post('/enhance', async (req, res) => {
  const { text, project_id } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required and must be at least 3 characters' });
  }

  try {
    let context: { projectName?: string; existingRequirements?: string[] } | undefined;

    if (project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', project_id)
        .single();

      const { data: existingReqs } = await supabase
        .from('requirements')
        .select('title')
        .eq('project_id', project_id)
        .order('created_at', { ascending: true });

      context = {
        projectName: project?.name,
        existingRequirements: (existingReqs || []).map((r: { title: string }) => r.title),
      };

      console.info(
        '[INFO] [requirements:enhance] Context loaded',
        JSON.stringify({ projectId: project_id, projectName: context.projectName, existingCount: context.existingRequirements?.length }),
      );
    }

    const result = await enhanceRequirement(text.trim(), context);
    res.json({ title: result.title, description: result.description });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [requirements:enhance] Enhancement failed', JSON.stringify({ error: message }));
    res.status(500).json({ error: `Enhancement failed: ${message}` });
  }
});

requirementsRouter.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('requirements')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

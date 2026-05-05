import { Router } from 'express';
import { createUserClient } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateRequirementBodySchema, UpdateRequirementBodySchema } from '../../shared/schemas';
import { enhanceRequirement } from '../openrouter';
import type { RepoAnalysis } from '../../shared/schemas/repoContext';
import { nextShortId } from '../lib/shortId';

export const requirementsRouter = Router();

requirementsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  let query = db
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
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('requirements')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

requirementsRouter.post('/', validateBody(CreateRequirementBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const projectId = req.body.project_id;
  const shortId = projectId
    ? await nextShortId(db, 'requirements', 'R', 'project_id', projectId)
    : `R${String(Date.now()).slice(-2)}`;
  const { data, error } = await db
    .from('requirements')
    .insert({ ...req.body, short_id: shortId })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

requirementsRouter.patch('/:id', validateBody(UpdateRequirementBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('requirements')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

requirementsRouter.post('/enhance', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { text, project_id } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required and must be at least 3 characters' });
  }

  try {
    let context: { projectName?: string; existingRequirements?: string[]; repoContext?: RepoAnalysis } | undefined;

    if (project_id) {
      const { data: project } = await db
        .from('projects')
        .select('name')
        .eq('id', project_id)
        .single();

      const { data: existingReqs } = await db
        .from('requirements')
        .select('title')
        .eq('project_id', project_id)
        .order('created_at', { ascending: true });

      const { data: repoCtx } = await db
        .from('repo_contexts')
        .select('analysis')
        .eq('project_id', project_id)
        .eq('status', 'ready')
        .single();

      context = {
        projectName: project?.name,
        existingRequirements: (existingReqs || []).map((r: { title: string }) => r.title),
        repoContext: repoCtx?.analysis as RepoAnalysis | undefined,
      };

      console.info(
        '[INFO] [requirements:enhance] Context loaded',
        JSON.stringify({ projectId: project_id, projectName: context.projectName, existingCount: context.existingRequirements?.length, hasRepoContext: !!context.repoContext }),
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
  const db = createUserClient(req.accessToken!);
  const { error } = await db
    .from('requirements')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

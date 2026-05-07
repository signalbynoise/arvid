import { Router } from 'express';
import { createUserClient } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateProjectBodySchema, UpdateProjectBodySchema } from '../../shared/schemas';
import { nextShortId } from '../lib/shortId';

export const projectsRouter = Router();

projectsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const workspaceId = req.query.workspace_id as string | undefined;

  let query = db
    .from('projects')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

projectsRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('projects')
    .select('*')
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

projectsRouter.post('/', validateBody(CreateProjectBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const shortId = await nextShortId(db, 'projects', 'P', 'user_id', userId);
  const body: Record<string, unknown> = {
    ...req.body,
    id: req.body.id || `p${Date.now()}`,
    user_id: userId,
    short_id: shortId,
  };
  if (req.body.workspace_id) body.workspace_id = req.body.workspace_id;
  if (req.body.team_id) body.team_id = req.body.team_id;

  const { data, error } = await db
    .from('projects')
    .insert(body)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

projectsRouter.patch('/:id', validateBody(UpdateProjectBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);

  const updates: Record<string, unknown> = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.github_repo_full_name !== undefined) {
    updates.github_repo_full_name = req.body.github_repo_full_name;
    updates.github_connected_at = req.body.github_repo_full_name ? new Date().toISOString() : null;
  }
  if (req.body.github_repo_default_branch !== undefined) {
    updates.github_repo_default_branch = req.body.github_repo_default_branch;
  }
  if (req.body.linear_project_id !== undefined) updates.linear_project_id = req.body.linear_project_id;
  if (req.body.linear_project_name !== undefined) updates.linear_project_name = req.body.linear_project_name;
  if (req.body.linear_team_id !== undefined) updates.linear_team_id = req.body.linear_team_id;

  const { data, error } = await db
    .from('projects')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

projectsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const now = new Date().toISOString();

  const { data: project } = await db
    .from('projects')
    .select('workspace_id')
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .single();

  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (project.workspace_id) {
    const { error } = await db
      .from('projects')
      .update({ is_deleted: true, deleted_at: now })
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(204).end();
  }

  const { error } = await db
    .from('projects')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

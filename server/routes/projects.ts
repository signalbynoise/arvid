import { Router } from 'express';
import { randomUUID } from 'crypto';
import { createUserClient, supabaseAdmin } from '../supabase';
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
    id: randomUUID(),
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
  if (req.body.supabase_project_ref !== undefined) {
    updates.supabase_project_ref = req.body.supabase_project_ref;
    updates.supabase_connected_at = req.body.supabase_project_ref ? new Date().toISOString() : null;
  }

  const { data, error } = await db
    .from('projects')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

projectsRouter.get('/:id/can-deactivate', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;

  const { data: project } = await db
    .from('projects')
    .select('workspace_id, team_id')
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .single();

  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (!project.workspace_id) {
    return res.json({ canDeactivate: false, reason: 'Project has no workspace context' });
  }

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', project.workspace_id)
    .eq('user_id', userId)
    .single();

  if (!membership || membership.role !== 'owner') {
    return res.json({ canDeactivate: false, reason: 'Only owners can deactivate' });
  }

  const countFilter = project.team_id
    ? db.from('projects').select('id', { count: 'exact', head: true }).eq('team_id', project.team_id).eq('is_deleted', false)
    : db.from('projects').select('id', { count: 'exact', head: true }).eq('workspace_id', project.workspace_id).is('team_id', null).eq('is_deleted', false);

  const { count } = await countFilter;

  if ((count ?? 0) <= 1) {
    return res.json({ canDeactivate: false, reason: 'Cannot deactivate the last project' });
  }

  res.json({ canDeactivate: true });
});

projectsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;

  const { data: project } = await db
    .from('projects')
    .select('workspace_id, team_id')
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .single();

  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (project.workspace_id) {
    const { data: membership } = await supabaseAdmin
      .from('workspace_memberships')
      .select('role')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Only workspace owners can deactivate projects' });
    }

    const countFilter = project.team_id
      ? db.from('projects').select('id', { count: 'exact', head: true }).eq('team_id', project.team_id).eq('is_deleted', false)
      : db.from('projects').select('id', { count: 'exact', head: true }).eq('workspace_id', project.workspace_id).is('team_id', null).eq('is_deleted', false);

    const { count } = await countFilter;

    if ((count ?? 0) <= 1) {
      return res.status(400).json({ error: 'Cannot deactivate the last project in a team' });
    }

    const now = new Date().toISOString();
    const { error } = await db
      .from('projects')
      .update({ is_deleted: true, deleted_at: now })
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(400).json({ error: 'Project has no workspace context' });
});

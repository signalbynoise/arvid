import { Router } from 'express';
import { createUserClient } from '../supabase';
import { supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateTeamBodySchema, UpdateTeamBodySchema } from '../../shared/schemas';
import { nextShortId } from '../lib/shortId';

export const teamsRouter = Router();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

teamsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const workspaceId = req.query.workspace_id as string | undefined;

  let query = db
    .from('teams')
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

teamsRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('teams')
    .select('*')
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

teamsRouter.post('/', validateBody(CreateTeamBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const { name, workspace_id } = req.body;
  const slug = generateSlug(name);
  const shortId = await nextShortId(supabaseAdmin, 'teams', 'T', 'workspace_id', workspace_id);

  const { data: team, error } = await db
    .from('teams')
    .insert({ name, slug, short_id: shortId, workspace_id, created_by: userId })
    .select()
    .single();

  if (error) {
    if (error.message.includes('teams_workspace_slug_active_unique')) {
      return res.status(400).json({ error: 'A team with this name already exists in the workspace', code: 'DUPLICATE_NAME' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(team);
});

teamsRouter.patch('/:id', validateBody(UpdateTeamBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);

  const updates: Record<string, unknown> = {};
  if (req.body.name !== undefined) {
    updates.name = req.body.name;
    updates.slug = generateSlug(req.body.name);
  }

  const { data, error } = await db
    .from('teams')
    .update(updates)
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error) {
    if (error.message.includes('teams_workspace_slug_active_unique')) {
      return res.status(400).json({ error: 'A team with this name already exists in the workspace', code: 'DUPLICATE_NAME' });
    }
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
});

teamsRouter.get('/:id/can-deactivate', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const teamId = req.params.id;

  const { data: team } = await db
    .from('teams')
    .select('workspace_id')
    .eq('id', teamId)
    .eq('is_deleted', false)
    .single();

  if (!team) return res.status(404).json({ error: 'Team not found' });

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', team.workspace_id)
    .eq('user_id', userId)
    .single();

  if (!membership || membership.role !== 'owner') {
    return res.json({ canDeactivate: false, reason: 'Only owners can deactivate' });
  }

  const { count } = await db
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', team.workspace_id)
    .eq('is_deleted', false);

  if ((count ?? 0) <= 1) {
    return res.json({ canDeactivate: false, reason: 'Cannot deactivate the last team' });
  }

  res.json({ canDeactivate: true });
});

teamsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const teamId = req.params.id;

  const { data: team } = await db
    .from('teams')
    .select('workspace_id')
    .eq('id', teamId)
    .eq('is_deleted', false)
    .single();

  if (!team) return res.status(404).json({ error: 'Team not found' });

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', team.workspace_id)
    .eq('user_id', userId)
    .single();

  if (!membership || membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only workspace owners can deactivate teams' });
  }

  const { count } = await db
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', team.workspace_id)
    .eq('is_deleted', false);

  if ((count ?? 0) <= 1) {
    return res.status(400).json({ error: 'Cannot deactivate the last team in a workspace' });
  }

  const now = new Date().toISOString();

  const { error: projectError } = await db
    .from('projects')
    .update({ is_deleted: true, deleted_at: now })
    .eq('team_id', teamId)
    .eq('is_deleted', false);

  if (projectError) {
    console.error('[ERROR] [teams:delete] Failed to soft-delete projects', JSON.stringify({ teamId, error: projectError.message }));
  }

  const { error } = await db
    .from('teams')
    .update({ is_deleted: true, deleted_at: now })
    .eq('id', teamId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

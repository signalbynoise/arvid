import { Router } from 'express';
import { createUserClient } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateTeamBodySchema, UpdateTeamBodySchema } from '../../shared/schemas';

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

  const { data: team, error } = await db
    .from('teams')
    .insert({ name, slug, workspace_id, created_by: userId })
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

teamsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const teamId = req.params.id;
  const now = new Date().toISOString();

  const { data: team } = await db
    .from('teams')
    .select('workspace_id')
    .eq('id', teamId)
    .eq('is_deleted', false)
    .single();

  if (!team) return res.status(404).json({ error: 'Team not found' });

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

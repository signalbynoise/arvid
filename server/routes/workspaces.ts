import { Router } from 'express';
import { createUserClient } from '../supabase';
import { supabase, supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateWorkspaceBodySchema, UpdateWorkspaceBodySchema } from '../../shared/schemas';

export const workspacesRouter = Router();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

workspacesRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('workspaces')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

workspacesRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('workspaces')
    .select('*')
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

workspacesRouter.post('/', validateBody(CreateWorkspaceBodySchema), async (req, res) => {
  const userId = req.user!.id;
  const { name } = req.body;
  const slug = generateSlug(name);

  console.info('[INFO] [workspaces:create] Creating workspace', JSON.stringify({ name, slug, userId }));

  const { data: workspace, error: wsError } = await supabaseAdmin
    .from('workspaces')
    .insert({ name, slug, created_by: userId })
    .select()
    .single();

  if (wsError) {
    console.error('[ERROR] [workspaces:create] Insert failed', JSON.stringify({ error: wsError.message, code: wsError.code }));
    if (wsError.message.includes('workspaces_slug_active_unique')) {
      return res.status(400).json({ error: 'A workspace with this name already exists', code: 'DUPLICATE_NAME' });
    }
    return res.status(400).json({ error: wsError.message });
  }

  const { error: memberError } = await supabaseAdmin
    .from('workspace_memberships')
    .insert({ workspace_id: workspace.id, user_id: userId, role: 'owner' });

  if (memberError) {
    console.error('[ERROR] [workspaces:create] Failed to create owner membership', JSON.stringify({ workspaceId: workspace.id, error: memberError.message }));
    await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id);
    return res.status(500).json({ error: 'Failed to initialize workspace membership' });
  }

  const teamSlug = 'general';
  const { error: teamError } = await supabaseAdmin
    .from('teams')
    .insert({ workspace_id: workspace.id, name: 'General', slug: teamSlug, created_by: userId });

  if (teamError) {
    console.error('[ERROR] [workspaces:create] Failed to create default team', JSON.stringify({ workspaceId: workspace.id, error: teamError.message }));
  }

  res.status(201).json(workspace);
});

workspacesRouter.patch('/:id', validateBody(UpdateWorkspaceBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);

  const updates: Record<string, unknown> = {};
  if (req.body.name !== undefined) {
    updates.name = req.body.name;
    updates.slug = generateSlug(req.body.name);
  }

  const { data, error } = await db
    .from('workspaces')
    .update(updates)
    .eq('id', req.params.id)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error) {
    if (error.message.includes('workspaces_slug_active_unique')) {
      return res.status(400).json({ error: 'A workspace with this name already exists', code: 'DUPLICATE_NAME' });
    }
    return res.status(400).json({ error: error.message });
  }
  res.json(data);
});

workspacesRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const workspaceId = req.params.id;
  const now = new Date().toISOString();

  const { error: teamError } = await db
    .from('teams')
    .update({ is_deleted: true, deleted_at: now })
    .eq('workspace_id', workspaceId)
    .eq('is_deleted', false);

  if (teamError) {
    console.error('[ERROR] [workspaces:delete] Failed to soft-delete teams', JSON.stringify({ workspaceId, error: teamError.message }));
  }

  const { error: projectError } = await db
    .from('projects')
    .update({ is_deleted: true, deleted_at: now })
    .eq('workspace_id', workspaceId)
    .eq('is_deleted', false);

  if (projectError) {
    console.error('[ERROR] [workspaces:delete] Failed to soft-delete projects', JSON.stringify({ workspaceId, error: projectError.message }));
  }

  const { error } = await db
    .from('workspaces')
    .update({ is_deleted: true, deleted_at: now })
    .eq('id', workspaceId);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

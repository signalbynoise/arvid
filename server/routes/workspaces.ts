import { Router } from 'express';
import { randomUUID } from 'crypto';
import { createUserClient } from '../supabase';
import { supabase, supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateWorkspaceBodySchema, UpdateWorkspaceBodySchema } from '../../shared/schemas';
import { generateShortId } from '../lib/shortId';

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

  const shortId = await generateShortId(supabaseAdmin, 'workspaces', 'W');

  console.info('[INFO] [workspaces:create] Creating workspace', JSON.stringify({ name, slug, shortId, userId }));

  const { data: workspace, error: wsError } = await supabaseAdmin
    .from('workspaces')
    .insert({ name, slug, short_id: shortId, created_by: userId })
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
  const teamShortId = await generateShortId(supabaseAdmin, 'teams', 'T');
  const { data: team, error: teamError } = await supabaseAdmin
    .from('teams')
    .insert({ workspace_id: workspace.id, name: 'General', slug: teamSlug, short_id: teamShortId, created_by: userId })
    .select('id')
    .single();

  if (teamError) {
    console.error('[ERROR] [workspaces:create] Failed to create default team', JSON.stringify({ workspaceId: workspace.id, error: teamError.message }));
  }

  if (team) {
    const projectShortId = await generateShortId(supabaseAdmin, 'projects', 'P');
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: randomUUID(),
        name: 'My Project',
        short_id: projectShortId,
        workspace_id: workspace.id,
        team_id: team.id,
        user_id: userId,
      });

    if (projectError) {
      console.error('[ERROR] [workspaces:create] Failed to create default project', JSON.stringify({ workspaceId: workspace.id, error: projectError.message }));
    }
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
  if (req.body.logo_url !== undefined) {
    updates.logo_url = req.body.logo_url;
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

workspacesRouter.get('/:id/deactivation-map', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const workspaceId = req.params.id;

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  const isOwner = membership?.role === 'owner';

  if (!isOwner) {
    return res.json({ isOwner: false, workspace: false, teams: {}, projects: {} });
  }

  const { count: wsCount } = await db
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false);

  const { data: teamsData } = await db
    .from('teams')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_deleted', false);

  const { data: projectsData } = await db
    .from('projects')
    .select('id, team_id')
    .eq('workspace_id', workspaceId)
    .eq('is_deleted', false);

  const teamCount = teamsData?.length ?? 0;
  const teamMap: Record<string, boolean> = {};
  for (const t of teamsData ?? []) {
    teamMap[t.id] = teamCount > 1;
  }

  const projectsByTeam = new Map<string | null, number>();
  for (const p of projectsData ?? []) {
    const key = p.team_id ?? '__ungrouped__';
    projectsByTeam.set(key, (projectsByTeam.get(key) ?? 0) + 1);
  }

  const projectMap: Record<string, boolean> = {};
  for (const p of projectsData ?? []) {
    const key = p.team_id ?? '__ungrouped__';
    projectMap[p.id] = (projectsByTeam.get(key) ?? 0) > 1;
  }

  res.json({
    isOwner: true,
    workspace: (wsCount ?? 0) > 1,
    teams: teamMap,
    projects: projectMap,
  });
});

workspacesRouter.get('/:id/can-deactivate', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const workspaceId = req.params.id;

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!membership || membership.role !== 'owner') {
    return res.json({ canDeactivate: false, reason: 'Only owners can deactivate' });
  }

  const { count } = await db
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false);

  if ((count ?? 0) <= 1) {
    return res.json({ canDeactivate: false, reason: 'Cannot deactivate the last workspace' });
  }

  res.json({ canDeactivate: true });
});

workspacesRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const workspaceId = req.params.id;

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!membership || membership.role !== 'owner') {
    return res.status(403).json({ error: 'Only workspace owners can deactivate workspaces' });
  }

  const { count } = await db
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false);

  if ((count ?? 0) <= 1) {
    return res.status(400).json({ error: 'Cannot deactivate the last workspace' });
  }

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

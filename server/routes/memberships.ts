import { Router } from 'express';
import { createUserClient } from '../supabase';
import { supabase, supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateMembershipBodySchema, UpdateMembershipBodySchema } from '../../shared/schemas';

export const membershipsRouter = Router();

membershipsRouter.get('/search-users', async (req, res) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  if (query.length < 2) {
    return res.json([]);
  }

  const { data, error } = await supabase.rpc('search_users_by_email', { query_text: query });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

membershipsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const workspaceId = req.query.workspace_id as string | undefined;

  if (!workspaceId) {
    return res.status(400).json({ error: 'workspace_id query parameter is required' });
  }

  const { data, error } = await db
    .rpc('get_workspace_members', { ws_id: workspaceId });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

membershipsRouter.post('/', validateBody(CreateMembershipBodySchema), async (req, res) => {
  const { workspace_id, email, role } = req.body;

  const { data: users } = await supabase.auth.admin.listUsers();
  const targetUser = (users?.users ?? []).find(u => u.email === email);

  if (!targetUser) {
    return res.status(404).json({ error: 'No user found with that email address', code: 'NOT_FOUND' });
  }

  const db = createUserClient(req.accessToken!);

  const { data: existing } = await db
    .from('workspace_memberships')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('user_id', targetUser.id)
    .single();

  if (existing) {
    return res.status(400).json({ error: 'User is already a member of this workspace', code: 'ALREADY_MEMBER' });
  }

  const { data, error } = await supabase
    .from('workspace_memberships')
    .insert({ workspace_id, user_id: targetUser.id, role })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({ ...data, email });
});

membershipsRouter.patch('/:id', validateBody(UpdateMembershipBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);

  const { data: membership } = await db
    .from('workspace_memberships')
    .select('id, workspace_id, user_id, role')
    .eq('id', req.params.id)
    .single();

  if (!membership) {
    return res.status(404).json({ error: 'Membership not found' });
  }

  if (membership.role === 'owner' && req.body.role !== 'owner') {
    const { count } = await db
      .from('workspace_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', membership.workspace_id)
      .eq('role', 'owner');

    if ((count ?? 0) <= 1) {
      return res.status(400).json({ error: 'Cannot change role of the last owner', code: 'LAST_OWNER' });
    }
  }

  const { data, error } = await db
    .from('workspace_memberships')
    .update({ role: req.body.role })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

membershipsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  const { data: membership } = await db
    .from('workspace_memberships')
    .select('id, workspace_id, role')
    .eq('id', req.params.id)
    .single();

  if (!membership) {
    return res.status(404).json({ error: 'Membership not found' });
  }

  if (membership.role === 'owner') {
    const { count } = await db
      .from('workspace_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', membership.workspace_id)
      .eq('role', 'owner');

    if ((count ?? 0) <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last owner of a workspace', code: 'LAST_OWNER' });
    }
  }

  const { error } = await db
    .from('workspace_memberships')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

membershipsRouter.post('/leave', async (req, res) => {
  const userId = req.user!.id;
  const { workspace_id } = req.body;

  if (!workspace_id) {
    return res.status(400).json({ error: 'workspace_id is required' });
  }

  const { data: membership } = await supabaseAdmin
    .from('workspace_memberships')
    .select('id, role')
    .eq('workspace_id', workspace_id)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return res.status(404).json({ error: 'You are not a member of this workspace' });
  }

  if (membership.role === 'owner') {
    const { count } = await supabaseAdmin
      .from('workspace_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .eq('role', 'owner');

    if ((count ?? 0) <= 1) {
      return res.status(400).json({ error: 'Cannot leave as the last owner. Transfer ownership first.', code: 'LAST_OWNER' });
    }
  }

  const { error } = await supabaseAdmin
    .from('workspace_memberships')
    .delete()
    .eq('id', membership.id);

  if (error) return res.status(400).json({ error: error.message });

  console.info('[INFO] [memberships:leave] User left workspace', JSON.stringify({ userId, workspaceId: workspace_id }));
  res.status(204).end();
});

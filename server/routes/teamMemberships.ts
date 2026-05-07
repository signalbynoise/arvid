import { Router } from 'express';
import { createUserClient } from '../supabase';
import { supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateTeamMembershipBodySchema } from '../../shared/schemas';

export const teamMembershipsRouter = Router();

teamMembershipsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const teamId = req.query.team_id as string | undefined;

  if (!teamId) {
    return res.status(400).json({ error: 'team_id query parameter is required' });
  }

  console.info('[INFO] [teamMemberships:list] Listing team members', JSON.stringify({ teamId }));

  const { data, error } = await db
    .rpc('get_team_members', { tm_id: teamId });

  if (error) {
    const { data: fallback, error: fbError } = await db
      .from('team_memberships')
      .select('id, team_id, user_id, role, joined_at')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (fbError) return res.status(500).json({ error: fbError.message });
    return res.json(fallback);
  }

  res.json(data);
});

teamMembershipsRouter.post('/', validateBody(CreateTeamMembershipBodySchema), async (req, res) => {
  const { team_id, email, role } = req.body;

  console.info('[INFO] [teamMemberships:create] Adding team member', JSON.stringify({ teamId: team_id, role }));

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
    (await supabaseAdmin.rpc('search_users_by_email', { query_text: email }).then(r => r.data?.[0]?.id)) ?? '',
  );

  if (!userData?.user) {
    return res.status(404).json({ error: 'No user found with that email address', code: 'NOT_FOUND' });
  }

  const db = createUserClient(req.accessToken!);

  const { data, error } = await db
    .from('team_memberships')
    .insert({ team_id, user_id: userData.user.id, role })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'User is already a team member', code: 'ALREADY_MEMBER' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({ ...data, email });
});

teamMembershipsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  console.info('[INFO] [teamMemberships:remove] Removing team member', JSON.stringify({ id: req.params.id }));

  const { error } = await db
    .from('team_memberships')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

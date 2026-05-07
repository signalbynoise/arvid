import { Router } from 'express';
import { createUserClient } from '../supabase';
import { supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateProjectMembershipBodySchema } from '../../shared/schemas';

export const projectMembershipsRouter = Router();

projectMembershipsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const projectId = req.query.project_id as string | undefined;

  if (!projectId) {
    return res.status(400).json({ error: 'project_id query parameter is required' });
  }

  console.info('[INFO] [projectMemberships:list] Listing project members', JSON.stringify({ projectId }));

  const { data, error } = await db
    .from('project_memberships')
    .select('id, project_id, user_id, role, joined_at')
    .eq('project_id', projectId)
    .order('joined_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const enriched = await Promise.all(
    data.map(async (m) => {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
      return { ...m, email: userData?.user?.email ?? undefined };
    }),
  );

  res.json(enriched);
});

projectMembershipsRouter.post('/', validateBody(CreateProjectMembershipBodySchema), async (req, res) => {
  const { project_id, email, role } = req.body;

  console.info('[INFO] [projectMemberships:create] Adding project member', JSON.stringify({ projectId: project_id, role }));

  const { data: users } = await supabaseAdmin.rpc('search_users_by_email', { query_text: email });
  const targetUser = users?.[0];

  if (!targetUser) {
    return res.status(404).json({ error: 'No user found with that email address', code: 'NOT_FOUND' });
  }

  const db = createUserClient(req.accessToken!);

  const { data, error } = await db
    .from('project_memberships')
    .insert({ project_id, user_id: targetUser.id, role })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'User is already a project member', code: 'ALREADY_MEMBER' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({ ...data, email });
});

projectMembershipsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  console.info('[INFO] [projectMemberships:remove] Removing project member', JSON.stringify({ id: req.params.id }));

  const { error } = await db
    .from('project_memberships')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

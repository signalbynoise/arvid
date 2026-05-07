import { Router } from 'express';
import { createUserClient } from '../supabase';
import { supabase, supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateInvitationBodySchema } from '../../shared/schemas';

export const invitationsRouter = Router();

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

invitationsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const workspaceId = req.query.workspace_id as string | undefined;

  if (!workspaceId) {
    return res.status(400).json({ error: 'workspace_id query parameter is required' });
  }

  console.info(
    '[INFO] [invitations:list] Listing invitations',
    JSON.stringify({ workspaceId }),
  );

  const { data, error } = await db
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ERROR] [invitations:list] Failed', JSON.stringify({ error: error.message }));
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

invitationsRouter.post('/', validateBody(CreateInvitationBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;
  const { workspace_id, team_id, email, role } = req.body;

  console.info(
    '[INFO] [invitations:create] Creating invitation',
    JSON.stringify({ workspaceId: workspace_id, role }),
  );

  const { data: existingInvite } = await db
    .from('workspace_invitations')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    console.warn('[WARN] [invitations:create] Duplicate pending invitation', JSON.stringify({ workspaceId: workspace_id }));
    return res.status(400).json({ error: 'An invitation is already pending for this email', code: 'ALREADY_INVITED' });
  }

  const body: Record<string, unknown> = {
    workspace_id,
    email,
    role,
    invited_by: userId,
  };
  if (team_id) body.team_id = team_id;

  const { data: invitation, error: insertError } = await db
    .from('workspace_invitations')
    .insert(body)
    .select()
    .single();

  if (insertError) {
    console.error('[ERROR] [invitations:create] Insert failed', JSON.stringify({ error: insertError.message }));
    return res.status(400).json({ error: insertError.message });
  }

  const redirectTo = `${APP_ORIGIN}?invite_accepted=1`;

  try {
    const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { workspace_id, team_id },
    });

    if (authError && authError.message.includes('already been registered')) {
      console.info('[INFO] [invitations:create] User exists, sending OTP magic link instead');

      const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });

      if (otpError) {
        console.warn('[WARN] [invitations:create] OTP email failed', JSON.stringify({ message: otpError.message }));
      } else {
        console.info('[INFO] [invitations:create] OTP email sent to existing user');
      }
    } else if (authError) {
      console.warn('[WARN] [invitations:create] inviteUserByEmail failed', JSON.stringify({ message: authError.message }));
    } else {
      console.info('[INFO] [invitations:create] Invitation email sent to new user');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [invitations:create] Email send failed', JSON.stringify({ error: message }));
  }

  res.status(201).json(invitation);
});

invitationsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  console.info('[INFO] [invitations:cancel] Cancelling invitation', JSON.stringify({ id: req.params.id }));

  const { error } = await db
    .from('workspace_invitations')
    .delete()
    .eq('id', req.params.id)
    .eq('status', 'pending');

  if (error) {
    console.error('[ERROR] [invitations:cancel] Failed', JSON.stringify({ error: error.message }));
    return res.status(400).json({ error: error.message });
  }

  res.status(204).end();
});

invitationsRouter.post('/accept', async (req, res) => {
  const userEmail = req.user!.email;
  const userId = req.user!.id;

  if (!userEmail) {
    return res.status(400).json({ error: 'User email not available' });
  }

  console.info('[INFO] [invitations:accept] Accepting pending invitations', JSON.stringify({ userId }));

  const { data: pending, error: fetchError } = await supabaseAdmin
    .from('workspace_invitations')
    .select('*')
    .eq('email', userEmail)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  if (fetchError) {
    console.error('[ERROR] [invitations:accept] Failed to fetch', JSON.stringify({ error: fetchError.message }));
    return res.status(500).json({ error: fetchError.message });
  }

  if (!pending || pending.length === 0) {
    return res.json([]);
  }

  const accepted = [];

  for (const invite of pending) {
    const { error: memberError } = await supabaseAdmin
      .from('workspace_memberships')
      .upsert(
        { workspace_id: invite.workspace_id, user_id: userId, role: invite.role },
        { onConflict: 'workspace_id,user_id' },
      );

    if (memberError) {
      console.warn(
        '[WARN] [invitations:accept] Membership upsert failed',
        JSON.stringify({ inviteId: invite.id, error: memberError.message }),
      );
      continue;
    }

    await supabaseAdmin
      .from('workspace_invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    accepted.push(invite);
    console.info('[INFO] [invitations:accept] Invitation accepted', JSON.stringify({ inviteId: invite.id, workspaceId: invite.workspace_id }));
  }

  res.json(accepted);
});

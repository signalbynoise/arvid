import { Router } from 'express';
import { Resend } from 'resend';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { createUserClient, supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateInvitationBodySchema } from '../../shared/schemas';
import { InviteEmail } from '../emails/InviteEmail';

export const invitationsRouter = Router();

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Arvid <arvid@arvid.work>';

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
  const { workspace_id, team_id, project_id, scope, email, role } = req.body;
  const inviteScope = scope || 'workspace';

  console.info(
    '[INFO] [invitations:create] Creating invitation',
    JSON.stringify({ workspaceId: workspace_id, scope: inviteScope, role }),
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
    scope: inviteScope,
    invited_by: userId,
  };
  if (team_id) body.team_id = team_id;
  if (project_id) body.project_id = project_id;

  const { data: invitation, error: insertError } = await db
    .from('workspace_invitations')
    .insert(body)
    .select()
    .single();

  if (insertError) {
    console.error('[ERROR] [invitations:create] Insert failed', JSON.stringify({ error: insertError.message }));
    return res.status(400).json({ error: insertError.message });
  }

  const inviteUrl = `${APP_ORIGIN}?invite=1`;

  try {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('name')
      .eq('id', workspace_id)
      .single();

    let scopeName: string | undefined;
    if (inviteScope === 'team' && team_id) {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('name')
        .eq('id', team_id)
        .single();
      scopeName = team?.name;
    } else if (inviteScope === 'project' && project_id) {
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('name')
        .eq('id', project_id)
        .single();
      scopeName = project?.name;
    }

    const inviterEmail = req.user!.email ?? 'Someone';
    const workspaceName = workspace?.name ?? 'a workspace';

    if (resend) {
      const html = await render(
        createElement(InviteEmail, {
          url: inviteUrl,
          inviterEmail,
          workspaceName,
          scope: inviteScope as 'workspace' | 'team' | 'project',
          scopeName,
        }),
      );

      const subject = inviteScope === 'workspace'
        ? `You've been invited to ${workspaceName} on Arvid`
        : `You've been invited to ${scopeName ?? inviteScope} in ${workspaceName} on Arvid`;

      const plainText = [
        subject,
        '',
        `${inviterEmail} has invited you to join ${workspaceName} on Arvid.`,
        '',
        'Accept the invitation:',
        inviteUrl,
      ].join('\n');

      const idempotencyKey = `invite/${invitation.id}`;

      const { error: sendError } = await resend.emails.send(
        { from: FROM_ADDRESS, to: [email], subject, html, text: plainText },
        { idempotencyKey },
      );

      if (sendError) {
        console.error('[ERROR] [invitations:create] Resend email failed', JSON.stringify({ to: email, error: sendError.message }));
      } else {
        console.info('[INFO] [invitations:create] Branded invite email sent', JSON.stringify({ to: email }));
      }
    } else {
      console.warn('[WARN] [invitations:create] Resend not configured, no invite email sent');
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
    const scope = invite.scope || 'workspace';

    if (scope === 'workspace') {
      const { error: memberError } = await supabaseAdmin
        .from('workspace_memberships')
        .upsert(
          { workspace_id: invite.workspace_id, user_id: userId, role: invite.role },
          { onConflict: 'workspace_id,user_id' },
        );

      if (memberError) {
        console.warn('[WARN] [invitations:accept] Workspace membership upsert failed', JSON.stringify({ inviteId: invite.id, error: memberError.message }));
        continue;
      }
    } else if (scope === 'team' && invite.team_id) {
      const { data: existing } = await supabaseAdmin
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', userId)
        .single();

      if (!existing) {
        await supabaseAdmin
          .from('workspace_memberships')
          .insert({ workspace_id: invite.workspace_id, user_id: userId, role: 'guest' });
      }

      const { error: teamError } = await supabaseAdmin
        .from('team_memberships')
        .upsert(
          { team_id: invite.team_id, user_id: userId, role: invite.role },
          { onConflict: 'team_id,user_id' },
        );

      if (teamError) {
        console.warn('[WARN] [invitations:accept] Team membership upsert failed', JSON.stringify({ inviteId: invite.id, error: teamError.message }));
        continue;
      }
    } else if (scope === 'project' && invite.project_id) {
      const { data: existing } = await supabaseAdmin
        .from('workspace_memberships')
        .select('role')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', userId)
        .single();

      if (!existing) {
        await supabaseAdmin
          .from('workspace_memberships')
          .insert({ workspace_id: invite.workspace_id, user_id: userId, role: 'guest' });
      }

      const { error: projError } = await supabaseAdmin
        .from('project_memberships')
        .upsert(
          { project_id: invite.project_id, user_id: userId, role: invite.role },
          { onConflict: 'project_id,user_id' },
        );

      if (projError) {
        console.warn('[WARN] [invitations:accept] Project membership upsert failed', JSON.stringify({ inviteId: invite.id, error: projError.message }));
        continue;
      }
    }

    await supabaseAdmin
      .from('workspace_invitations')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    accepted.push(invite);
    console.info('[INFO] [invitations:accept] Invitation accepted', JSON.stringify({ inviteId: invite.id, workspaceId: invite.workspace_id, scope }));
  }

  res.json(accepted);
});

import { Router } from 'express';
import { supabaseAdmin } from '../supabase';

export const accountRouter = Router();

const GRACE_PERIOD_DAYS = 7;

accountRouter.get('/deletion-blockers', async (req, res) => {
  const userId = req.user!.id;

  console.info('[INFO] [account:deletionBlockers] Checking blockers', JSON.stringify({ userId }));

  const blockers: string[] = [];

  const { data: ownedWorkspaces } = await supabaseAdmin
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('role', 'owner');

  if (ownedWorkspaces && ownedWorkspaces.length > 0) {
    for (const ws of ownedWorkspaces) {
      const { count } = await supabaseAdmin
        .from('workspace_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', ws.workspace_id)
        .eq('role', 'owner')
        .neq('user_id', userId);

      if (!count || count === 0) {
        const { data: workspace } = await supabaseAdmin
          .from('workspaces')
          .select('name')
          .eq('id', ws.workspace_id)
          .single();

        blockers.push(`You are the sole owner of "${workspace?.name ?? 'a workspace'}". Transfer ownership or delete it first.`);
      }
    }
  }

  const { data: activeSub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  if (activeSub) {
    blockers.push('You have an active subscription. Cancel it before deleting your account.');
  }

  const { data: pendingDeletion } = await supabaseAdmin
    .from('account_deletions')
    .select('delete_after')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  res.json({
    blockers,
    canDelete: blockers.length === 0,
    pendingDeletion: pendingDeletion ? { deleteAfter: pendingDeletion.delete_after } : null,
  });
});

accountRouter.delete('/', async (req, res) => {
  const userId = req.user!.id;
  const userEmail = req.user!.email;
  const { confirmEmail } = req.body ?? {};

  if (!confirmEmail || confirmEmail.toLowerCase() !== userEmail?.toLowerCase()) {
    return res.status(400).json({ error: 'Email confirmation does not match' });
  }

  console.info('[INFO] [account:delete] Account deletion requested', JSON.stringify({ userId }));

  const { data: ownedWorkspaces } = await supabaseAdmin
    .from('workspace_memberships')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('role', 'owner');

  if (ownedWorkspaces && ownedWorkspaces.length > 0) {
    for (const ws of ownedWorkspaces) {
      const { count } = await supabaseAdmin
        .from('workspace_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', ws.workspace_id)
        .eq('role', 'owner')
        .neq('user_id', userId);

      if (!count || count === 0) {
        console.warn('[WARN] [account:delete] Blocked: sole owner', JSON.stringify({ userId, workspaceId: ws.workspace_id }));
        return res.status(409).json({ error: 'Cannot delete — you are the sole owner of a workspace' });
      }
    }
  }

  const { data: activeSub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  if (activeSub) {
    console.warn('[WARN] [account:delete] Blocked: active subscription', JSON.stringify({ userId }));
    return res.status(409).json({ error: 'Cannot delete — cancel your subscription first' });
  }

  const deleteAfter = new Date();
  deleteAfter.setDate(deleteAfter.getDate() + GRACE_PERIOD_DAYS);

  const { error: insertError } = await supabaseAdmin
    .from('account_deletions')
    .upsert(
      {
        user_id: userId,
        email: userEmail,
        scheduled_at: new Date().toISOString(),
        delete_after: deleteAfter.toISOString(),
        status: 'pending',
      },
      { onConflict: 'user_id' },
    );

  if (insertError) {
    console.error('[ERROR] [account:delete] Failed to schedule deletion', JSON.stringify({ error: insertError.message }));
    return res.status(500).json({ error: 'Failed to schedule deletion' });
  }

  console.info('[INFO] [account:delete] Deletion scheduled', JSON.stringify({ userId, deleteAfter: deleteAfter.toISOString() }));

  res.json({
    message: 'Account scheduled for deletion',
    deleteAfter: deleteAfter.toISOString(),
  });
});

accountRouter.post('/cancel-deletion', async (req, res) => {
  const userId = req.user!.id;

  console.info('[INFO] [account:cancelDeletion] Cancelling deletion', JSON.stringify({ userId }));

  const { error } = await supabaseAdmin
    .from('account_deletions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('[ERROR] [account:cancelDeletion] Failed', JSON.stringify({ error: error.message }));
    return res.status(500).json({ error: 'Failed to cancel deletion' });
  }

  console.info('[INFO] [account:cancelDeletion] Deletion cancelled', JSON.stringify({ userId }));
  res.json({ message: 'Account deletion cancelled' });
});

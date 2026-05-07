import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../supabase';

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const workspaceId = req.params.workspace_id ?? req.params.id ?? req.body?.workspace_id;

  if (!workspaceId) {
    res.status(400).json({ error: 'Workspace context required' });
    return;
  }

  const { data: membership, error } = await supabaseAdmin
    .from('workspace_memberships')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', req.user.id)
    .single();

  if (error || !membership) {
    res.status(403).json({ error: 'Not a member of this workspace' });
    return;
  }

  if (membership.role !== 'owner') {
    res.status(403).json({ error: 'Only workspace owners can perform this action' });
    return;
  }

  next();
}

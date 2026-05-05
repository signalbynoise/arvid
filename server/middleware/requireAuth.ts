import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase';
import { refreshLinearToken } from '../lib/linearClient';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
      accessToken?: string;
      githubToken?: string;
      linearToken?: string;
      slackToken?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error(`[ERROR] [auth:verify] Token verification failed: ${error?.message ?? 'no user'}`);
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = { id: user.id, email: user.email };
  req.accessToken = token;
  next();
}

export async function requireGitHub(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data, error } = await supabase
    .from('github_connections')
    .select('access_token')
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) {
    console.warn(
      `[WARN] [auth:requireGitHub] No GitHub connection found`,
      JSON.stringify({ userId: req.user.id }),
    );
    res.status(403).json({ error: 'GitHub account not connected. Please connect your GitHub account first.' });
    return;
  }

  req.githubToken = data.access_token;
  next();
}

export async function requireLinear(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data, error } = await supabase
    .from('linear_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) {
    console.warn(
      `[WARN] [auth:requireLinear] No Linear connection found`,
      JSON.stringify({ userId: req.user.id }),
    );
    res.status(403).json({ error: 'Linear account not connected. Please connect your Linear account first.' });
    return;
  }

  const expiresAt = new Date(data.token_expires_at).getTime();
  const bufferMs = 5 * 60 * 1000;

  if (Date.now() > expiresAt - bufferMs) {
    console.info(
      `[INFO] [auth:requireLinear] Token expired or expiring soon, refreshing`,
      JSON.stringify({ userId: req.user.id }),
    );

    try {
      const tokens = await refreshLinearToken(data.refresh_token);
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      await supabase
        .from('linear_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', req.user.id);

      req.linearToken = tokens.access_token;
    } catch (refreshErr) {
      const message = refreshErr instanceof Error ? refreshErr.message : 'Unknown error';
      console.error(
        `[ERROR] [auth:requireLinear] Token refresh failed`,
        JSON.stringify({ userId: req.user.id, error: message }),
      );
      res.status(401).json({ error: 'Linear token expired and refresh failed. Please reconnect your Linear account.' });
      return;
    }
  } else {
    req.linearToken = data.access_token;
  }

  next();
}

export async function requireSlack(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data, error } = await supabase
    .from('slack_connections')
    .select('access_token')
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) {
    console.warn(
      `[WARN] [auth:requireSlack] No Slack connection found`,
      JSON.stringify({ userId: req.user.id }),
    );
    res.status(403).json({ error: 'Slack workspace not connected. Please connect your Slack workspace first.' });
    return;
  }

  req.slackToken = data.access_token;
  next();
}

import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../supabase';
import { getMe, getFileNodes, getImages, extractDesignSummary } from '../lib/figmaClient';
import { parseFigmaUrl } from '../../shared/figmaUrl';
import type { FigmaDesignData } from '../lib/figmaClient';

export const figmaRouter = Router();
export const figmaCallbackRouter = Router();

const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID;
const FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET;
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

const FIGMA_SCOPES = 'current_user:read,file_content:read,file_metadata:read';

if (!FIGMA_CLIENT_ID || !FIGMA_CLIENT_SECRET) {
  console.warn('[WARN] [figma:init] FIGMA_CLIENT_ID or FIGMA_CLIENT_SECRET not set — Figma integration will not work');
}

const pendingOAuthStates = new Map<string, { userId: string; expiresAt: number }>();

// --- OAuth Flow ---

figmaRouter.get('/auth', (req, res) => {
  if (!FIGMA_CLIENT_ID) {
    return res.status(500).json({ error: 'Figma OAuth not configured on server' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingOAuthStates.set(state, {
    userId: req.user!.id,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const redirectUri = `${req.protocol}://${req.get('host')}/api/figma/callback`;

  const params = new URLSearchParams({
    client_id: FIGMA_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: FIGMA_SCOPES,
    state,
    response_type: 'code',
  });

  console.info(
    '[INFO] [figma:auth] Redirecting to Figma OAuth',
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ url: `https://www.figma.com/oauth?${params.toString()}` });
});

figmaCallbackRouter.get('/', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    return res.redirect(`${APP_ORIGIN}?figma_error=missing_params`);
  }

  const pending = pendingOAuthStates.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingOAuthStates.delete(state);
    return res.redirect(`${APP_ORIGIN}?figma_error=invalid_state`);
  }

  pendingOAuthStates.delete(state);
  const { userId } = pending;

  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/figma/callback`;

    const tokenRes = await fetch('https://api.figma.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: FIGMA_CLIENT_ID!,
        client_secret: FIGMA_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      console.error(
        '[ERROR] [figma:callback] Token exchange failed',
        JSON.stringify({ error: tokenData.error, description: tokenData.error_description }),
      );
      return res.redirect(`${APP_ORIGIN}?figma_error=token_exchange_failed`);
    }

    const figmaUser = await getMe(tokenData.access_token);

    const { error: upsertError } = await supabase
      .from('figma_connections')
      .upsert(
        {
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token ?? null,
          token_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          figma_user_id: figmaUser.id,
          figma_username: figmaUser.handle,
          figma_email: figmaUser.email,
          scopes: FIGMA_SCOPES,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error(
        '[ERROR] [figma:callback] Failed to store connection',
        JSON.stringify({ error: upsertError.message }),
      );
      return res.redirect(`${APP_ORIGIN}?figma_error=storage_failed`);
    }

    console.info(
      '[INFO] [figma:callback] Figma connected successfully',
      JSON.stringify({ userId, figmaUsername: figmaUser.handle }),
    );

    res.redirect(`${APP_ORIGIN}?figma_connected=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [figma:callback] OAuth flow failed',
      JSON.stringify({ userId, error: message }),
    );
    res.redirect(`${APP_ORIGIN}?figma_error=unknown`);
  }
});

// --- Connection status ---

figmaRouter.get('/status', async (req, res) => {
  const { data, error } = await supabase
    .from('figma_connections')
    .select('figma_username, figma_email, connected_at')
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    username: data.figma_username,
    email: data.figma_email,
  });
});

figmaRouter.delete('/connect', async (req, res) => {
  const userId = req.user!.id;

  const { error } = await supabase
    .from('figma_connections')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error(
      '[ERROR] [figma:disconnect] Failed to delete connection',
      JSON.stringify({ userId, error: error.message }),
    );
    return res.status(500).json({ error: 'Failed to disconnect Figma' });
  }

  console.info(
    '[INFO] [figma:disconnect] Figma disconnected',
    JSON.stringify({ userId }),
  );

  res.json({ disconnected: true });
});

// --- Design resolution ---

figmaRouter.post('/resolve', async (req, res) => {
  const { figma_urls } = req.body as { figma_urls?: string[] };
  if (!figma_urls || !Array.isArray(figma_urls) || figma_urls.length === 0) {
    return res.status(400).json({ error: 'figma_urls array is required' });
  }

  const userId = req.user!.id;

  const { data: connection, error: connError } = await supabase
    .from('figma_connections')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (connError || !connection) {
    return res.status(403).json({ error: 'Figma not connected. Please connect your Figma account first.' });
  }

  console.info(
    '[INFO] [figma:resolve] Resolving Figma designs',
    JSON.stringify({ userId, urlCount: figma_urls.length }),
  );

  const designs: FigmaDesignData[] = [];

  const grouped = new Map<string, Array<{ url: string; nodeId: string | null }>>();
  for (const url of figma_urls) {
    const parsed = parseFigmaUrl(url);
    if (!parsed) continue;
    const group = grouped.get(parsed.fileKey) || [];
    group.push({ url, nodeId: parsed.nodeId });
    grouped.set(parsed.fileKey, group);
  }

  for (const [fileKey, entries] of grouped) {
    const nodeIds = entries.map(e => e.nodeId).filter((id): id is string => id !== null);
    if (nodeIds.length === 0) continue;

    try {
      const [nodesRes, imagesRes] = await Promise.all([
        getFileNodes(connection.access_token, fileKey, nodeIds),
        getImages(connection.access_token, fileKey, nodeIds),
      ]);

      for (const entry of entries) {
        const nodeData = entry.nodeId ? nodesRes.nodes[entry.nodeId] : null;
        const thumbnailUrl = entry.nodeId ? imagesRes.images[entry.nodeId] ?? null : null;

        const nodeName = nodeData?.document?.name ?? 'Unknown';
        const structuralSummary = nodeData?.document
          ? extractDesignSummary(nodeData.document)
          : '';

        designs.push({
          url: entry.url,
          fileKey,
          nodeId: entry.nodeId,
          nodeName,
          thumbnailUrl,
          structuralSummary,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        '[ERROR] [figma:resolve] Failed to resolve file',
        JSON.stringify({ fileKey, error: message }),
      );
      for (const entry of entries) {
        designs.push({
          url: entry.url,
          fileKey,
          nodeId: entry.nodeId,
          nodeName: 'Error loading design',
          thumbnailUrl: null,
          structuralSummary: '',
        });
      }
    }
  }

  console.info(
    '[INFO] [figma:resolve] Resolution complete',
    JSON.stringify({ userId, resolvedCount: designs.length }),
  );

  res.json({ designs });
});

import { Router } from 'express';
import { supabase } from '../supabase';
import { RenderClient, RenderAuthError } from '../lib/renderClient';
import { repoMatches } from '../../shared/lib/repoMatch';

export const renderRouter = Router();

renderRouter.post('/validate-key', async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const client = new RenderClient({ apiKey });
    const owners = await client.listOwners();

    if (!owners.length) {
      return res.status(400).json({ error: 'No workspaces found for this API key.' });
    }

    return res.json({
      valid: true,
      owners: owners.map(o => ({
        id: o.owner.id,
        name: o.owner.name || o.owner.email,
        email: o.owner.email,
        type: o.owner.type,
      })),
    });
  } catch (err) {
    if (err instanceof RenderAuthError) {
      return res.status(401).json({ error: 'Invalid Render API key' });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [render:validate-key] Validation failed`,
      JSON.stringify({ error: message }),
    );
    return res.status(500).json({ error: 'Failed to validate Render API key' });
  }
});

renderRouter.post('/connect', async (req, res) => {
  const userId = req.user!.id;
  const { apiKey, ownerId, ownerName } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'API key is required' });
  }

  if (!ownerId || typeof ownerId !== 'string') {
    return res.status(400).json({ error: 'Workspace selection is required' });
  }

  try {
    const client = new RenderClient({ apiKey });
    await client.listOwners();

    const { error } = await supabase
      .from('render_connections')
      .upsert({
        user_id: userId,
        api_key: apiKey,
        render_owner_id: ownerId,
        render_owner_name: ownerName || ownerId,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(
        `[ERROR] [render:connect] Failed to store connection`,
        JSON.stringify({ userId, error: error.message }),
      );
      return res.status(500).json({ error: 'Failed to store Render connection' });
    }

    console.info(
      `[INFO] [render:connect] Connected successfully`,
      JSON.stringify({ userId, ownerId, ownerName }),
    );

    return res.json({
      connected: true,
      ownerName: ownerName || ownerId,
      ownerId,
    });
  } catch (err) {
    if (err instanceof RenderAuthError) {
      return res.status(401).json({ error: 'Invalid Render API key' });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [render:connect] Validation failed`,
      JSON.stringify({ userId, error: message }),
    );
    return res.status(500).json({ error: 'Failed to validate Render API key' });
  }
});

renderRouter.get('/status', async (req, res) => {
  const userId = req.user!.id;

  const { data, error } = await supabase
    .from('render_connections')
    .select('render_owner_id, render_owner_name, connected_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return res.json({ connected: false });
  }

  return res.json({
    connected: true,
    ownerName: data.render_owner_name,
    ownerId: data.render_owner_id,
    connectedAt: data.connected_at,
  });
});

renderRouter.delete('/connect', async (req, res) => {
  const userId = req.user!.id;

  const { error } = await supabase
    .from('render_connections')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error(
      `[ERROR] [render:disconnect] Failed to remove connection`,
      JSON.stringify({ userId, error: error.message }),
    );
    return res.status(500).json({ error: 'Failed to disconnect Render' });
  }

  console.info(
    `[INFO] [render:disconnect] Disconnected`,
    JSON.stringify({ userId }),
  );

  return res.json({ connected: false });
});

renderRouter.get('/services', async (req, res) => {
  const userId = req.user!.id;

  const { data: conn, error: connErr } = await supabase
    .from('render_connections')
    .select('api_key, render_owner_id')
    .eq('user_id', userId)
    .single();

  if (connErr || !conn) {
    return res.status(403).json({ error: 'Render not connected. Please connect your Render account first.' });
  }

  try {
    const client = new RenderClient({ apiKey: conn.api_key });
    const services = await client.listServices(conn.render_owner_id ?? undefined);

    const mapped = services.map(s => ({
      id: s.service.id,
      name: s.service.name,
      type: s.service.type,
      url: s.service.serviceDetails?.url ?? null,
      branch: s.service.branch ?? null,
      repo: s.service.repo ?? null,
      suspended: s.service.suspended ?? null,
    }));

    return res.json(mapped);
  } catch (err) {
    if (err instanceof RenderAuthError) {
      return res.status(401).json({ error: 'Render API key is invalid. Please reconnect.' });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [render:services] Failed to list services`,
      JSON.stringify({ userId, error: message }),
    );
    return res.status(500).json({ error: 'Failed to fetch Render services' });
  }
});

const FAILED_DEPLOY_STATUSES = ['build_failed', 'update_failed', 'canceled', 'deactivated'];

renderRouter.get('/project-services/:projectId', async (req, res) => {
  const userId = req.user!.id;
  const { projectId } = req.params;

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('github_repo_full_name')
    .eq('id', projectId)
    .single();

  if (projErr || !project?.github_repo_full_name) {
    return res.json({ services: [], matched: false, reason: 'no_repo' });
  }

  const { data: conn, error: connErr } = await supabase
    .from('render_connections')
    .select('api_key, render_owner_id')
    .eq('user_id', userId)
    .single();

  if (connErr || !conn) {
    return res.json({ services: [], matched: false, reason: 'no_render' });
  }

  try {
    const client = new RenderClient({ apiKey: conn.api_key });
    const allServices = await client.listServices(conn.render_owner_id ?? undefined);
    const matched = allServices.filter(s => repoMatches(s.service.repo, project.github_repo_full_name));

    if (matched.length === 0) {
      return res.json({ services: [], matched: false, reason: 'no_match' });
    }

    const services = await Promise.all(
      matched.map(async (s) => {
        const deploys = await client.listDeploys(s.service.id, { limit: 1 });
        const latest = deploys[0] ?? null;

        let deployStatus = 'unknown';
        if (latest) {
          if (latest.status === 'live') deployStatus = 'live';
          else if (FAILED_DEPLOY_STATUSES.includes(latest.status)) deployStatus = 'deploy_failed';
          else deployStatus = 'not_deployed';
        }

        return {
          id: s.service.id,
          name: s.service.name,
          type: s.service.type,
          url: s.service.serviceDetails?.url ?? null,
          deployStatus,
          commitSha: latest?.commit?.id ?? null,
          deployedAt: latest?.finishedAt ?? null,
        };
      }),
    );

    return res.json({ services, matched: true });
  } catch (err) {
    if (err instanceof RenderAuthError) {
      return res.status(401).json({ error: 'Render API key is invalid. Please reconnect.' });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [render:project-services] Failed to fetch project services`,
      JSON.stringify({ userId, projectId, error: message }),
    );
    return res.status(500).json({ error: 'Failed to fetch project services' });
  }
});

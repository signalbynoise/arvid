import { Router } from 'express';
import crypto from 'crypto';
import { supabase, createUserClient } from '../supabase';
import { requireLinear } from '../middleware/requireAuth';
import { listLinearTeams, listLinearProjects, createLinearIssue, updateLinearIssue, exchangeLinearCode, fetchLinearViewer } from '../lib/linearClient';
import { sendSlackNotification } from '../lib/slackNotifier';
import type { Summary } from '../../shared/schemas';

export const linearRouter = Router();
export const linearCallbackRouter = Router();

const LINEAR_CLIENT_ID = process.env.LINEAR_CLIENT_ID;
const LINEAR_CLIENT_SECRET = process.env.LINEAR_CLIENT_SECRET;
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

if (!LINEAR_CLIENT_ID || !LINEAR_CLIENT_SECRET) {
  console.warn('[WARN] [linear:init] LINEAR_CLIENT_ID or LINEAR_CLIENT_SECRET not set — Linear OAuth will not work');
}

const pendingOAuthStates = new Map<string, { userId: string; expiresAt: number }>();

// --- OAuth Flow ---

linearRouter.get('/auth', (req, res) => {
  if (!LINEAR_CLIENT_ID) {
    return res.status(500).json({ error: 'Linear OAuth not configured on server' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingOAuthStates.set(state, {
    userId: req.user!.id,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const redirectUri = `${req.protocol}://${req.get('host')}/api/linear/callback`;

  const params = new URLSearchParams({
    client_id: LINEAR_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read,write',
    state,
  });

  console.info(
    '[INFO] [linear:auth] Redirecting to Linear OAuth',
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ url: `https://linear.app/oauth/authorize?${params.toString()}` });
});

linearCallbackRouter.get('/', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    return res.redirect(`${APP_ORIGIN}?linear_error=missing_params`);
  }

  const pending = pendingOAuthStates.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingOAuthStates.delete(state);
    return res.redirect(`${APP_ORIGIN}?linear_error=invalid_state`);
  }

  pendingOAuthStates.delete(state);
  const { userId } = pending;

  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/linear/callback`;
    const tokens = await exchangeLinearCode(code, redirectUri);
    const viewer = await fetchLinearViewer(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('linear_connections')
      .upsert({
        user_id: userId,
        linear_user_id: viewer.id,
        linear_username: viewer.displayName,
        linear_avatar_url: viewer.avatarUrl,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        scopes: tokens.scope || 'read,write',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error(
        '[ERROR] [linear:callback] Failed to save connection',
        JSON.stringify({ userId, error: upsertError.message }),
      );
      return res.redirect(`${APP_ORIGIN}?linear_error=save_failed`);
    }

    console.info(
      '[INFO] [linear:callback] Linear connected successfully',
      JSON.stringify({ userId, linearUsername: viewer.displayName }),
    );

    res.redirect(`${APP_ORIGIN}?linear_connected=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [linear:callback] OAuth callback failed',
      JSON.stringify({ userId, error: message }),
    );
    res.redirect(`${APP_ORIGIN}?linear_error=callback_failed`);
  }
});

// --- Connection Management ---

linearRouter.get('/status', async (req, res) => {
  const { data, error } = await supabase
    .from('linear_connections')
    .select('linear_username, linear_avatar_url, scopes, connected_at')
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    username: data.linear_username,
    avatarUrl: data.linear_avatar_url,
    scopes: data.scopes,
    connectedAt: data.connected_at,
  });
});

linearRouter.delete('/connect', async (req, res) => {
  const { error } = await supabase
    .from('linear_connections')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) {
    console.error(
      '[ERROR] [linear:disconnect] Failed to remove connection',
      JSON.stringify({ userId: req.user!.id, error: error.message }),
    );
    return res.status(500).json({ error: 'Failed to disconnect Linear' });
  }

  console.info(
    '[INFO] [linear:disconnect] Linear disconnected',
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ connected: false });
});

// --- Linear Data (require connected account) ---

linearRouter.get('/teams', requireLinear, async (req, res) => {
  try {
    const teams = await listLinearTeams(req.linearToken!);
    res.json(teams);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [linear:teams] Failed to fetch teams', JSON.stringify({ error: message }));
    res.status(500).json({ error: message });
  }
});

linearRouter.get('/projects', requireLinear, async (req, res) => {
  const teamId = req.query.team_id as string;
  if (!teamId) {
    return res.status(400).json({ error: 'team_id query parameter is required' });
  }

  try {
    const projects = await listLinearProjects(req.linearToken!, teamId);
    res.json(projects);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [linear:projects] Failed to fetch projects', JSON.stringify({ error: message }));
    res.status(500).json({ error: message });
  }
});

function buildIssueMarkdown(summary: Summary, requirementTitle: string, figmaUrls?: string[]): string {
  const sections = [
    `## Objective\n\n${summary.coreObjective}`,
    `## Synthesis\n\n${summary.synthesis}`,
    `## Architecture\n\n${summary.architecture}`,
    `## Constraints\n\n${summary.constraints}`,
    `## Unverified Risks\n\n${summary.unverifiedRisks}`,
  ];

  if (figmaUrls && figmaUrls.length > 0) {
    const links = figmaUrls.map(url => `- [${url}](${url})`).join('\n');
    sections.push(`## Design Files\n\n${links}`);
  }

  return `# ${requirementTitle}\n\n${sections.join('\n\n---\n\n')}\n\n---\n\n*Generated by Arvid — Knowledge Completeness: ${summary.completeness}%*`;
}

linearRouter.post('/send/:requirementId', requireLinear, async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { requirementId } = req.params;

  console.info('[INFO] [linear:send] Sending requirement to Linear', JSON.stringify({ requirementId }));

  const { data: requirement, error: reqError } = await db
    .from('requirements')
    .select('*')
    .eq('id', requirementId)
    .single();

  if (reqError || !requirement) {
    return res.status(404).json({ error: `Requirement ${requirementId} not found` });
  }

  if (requirement.linear_issue_id) {
    return res.status(409).json({ error: 'Requirement already sent to Linear', linearIssueUrl: requirement.linear_issue_url });
  }

  const { data: summary, error: sumError } = await db
    .from('summaries')
    .select('*')
    .eq('requirement_id', requirementId)
    .single();

  if (sumError || !summary) {
    return res.status(400).json({ error: 'No summary exists for this requirement. Generate a summary first.' });
  }

  const { data: project, error: projError } = await db
    .from('projects')
    .select('linear_project_id, linear_team_id')
    .eq('id', requirement.project_id)
    .single();

  if (projError || !project?.linear_project_id || !project?.linear_team_id) {
    return res.status(400).json({ error: 'Project is not linked to a Linear project. Link one in the sidebar first.' });
  }

  try {
    const { data: figmaRows } = await db
      .from('requirement_figma_links')
      .select('figma_url')
      .eq('requirement_id', requirementId);

    const figmaUrls = (figmaRows || []).map((r: { figma_url: string }) => r.figma_url);

    const domainSummary: Summary = {
      id: summary.id,
      requirementId: summary.requirement_id,
      shortId: summary.short_id ?? undefined,
      synthesis: summary.synthesis,
      coreObjective: summary.core_objective,
      architecture: summary.architecture,
      constraints: summary.constraints,
      unverifiedRisks: summary.unverified_risks,
      completeness: summary.completeness,
      completenessReasoning: summary.completeness_reasoning,
      model: summary.model,
      generatedAt: summary.generated_at ?? undefined,
    };

    const description = buildIssueMarkdown(domainSummary, requirement.title, figmaUrls.length > 0 ? figmaUrls : undefined);

    const issue = await createLinearIssue(req.linearToken!, {
      teamId: project.linear_team_id,
      projectId: project.linear_project_id,
      title: requirement.title,
      description,
    });

    const { data: updated, error: updateError } = await db
      .from('requirements')
      .update({
        linear_issue_id: issue.id,
        linear_issue_identifier: issue.identifier,
        linear_issue_url: issue.url,
        linear_status: issue.state.name,
        linear_status_type: issue.state.type,
      })
      .eq('id', requirementId)
      .select()
      .single();

    if (updateError) {
      console.error('[ERROR] [linear:send] Failed to update requirement with Linear data', JSON.stringify({ error: updateError.message }));
      return res.status(500).json({ error: updateError.message });
    }

    console.info('[INFO] [linear:send] Requirement sent to Linear', JSON.stringify({
      requirementId,
      issueIdentifier: issue.identifier,
      issueUrl: issue.url,
    }));

    if (requirement.project_id) {
      sendSlackNotification({
        projectId: requirement.project_id,
        eventType: 'sent_to_linear',
        title: requirement.title,
        summary: `Sent as ${issue.identifier} to Linear`,
        entityId: requirementId,
        db,
      });
    }

    res.status(201).json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [linear:send] Failed to create Linear issue', JSON.stringify({ requirementId, error: message }));
    res.status(500).json({ error: `Failed to create Linear issue: ${message}` });
  }
});

linearRouter.patch('/sync/:requirementId', requireLinear, async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { requirementId } = req.params;

  console.info('[INFO] [linear:sync] Syncing requirement to Linear', JSON.stringify({ requirementId }));

  const { data: requirement, error: reqError } = await db
    .from('requirements')
    .select('*')
    .eq('id', requirementId)
    .single();

  if (reqError || !requirement) {
    return res.status(404).json({ error: `Requirement ${requirementId} not found` });
  }

  if (!requirement.linear_issue_id) {
    return res.status(400).json({ error: 'No Linear issue linked to this requirement' });
  }

  const { data: summary, error: sumError } = await db
    .from('summaries')
    .select('*')
    .eq('requirement_id', requirementId)
    .single();

  if (sumError || !summary) {
    return res.status(400).json({ error: 'No summary exists for this requirement' });
  }

  try {
    const { data: figmaRows } = await db
      .from('requirement_figma_links')
      .select('figma_url')
      .eq('requirement_id', requirementId);

    const figmaUrls = (figmaRows || []).map((r: { figma_url: string }) => r.figma_url);

    const domainSummary: Summary = {
      id: summary.id,
      requirementId: summary.requirement_id,
      shortId: summary.short_id ?? undefined,
      synthesis: summary.synthesis,
      coreObjective: summary.core_objective,
      architecture: summary.architecture,
      constraints: summary.constraints,
      unverifiedRisks: summary.unverified_risks,
      completeness: summary.completeness,
      completenessReasoning: summary.completeness_reasoning,
      model: summary.model,
      generatedAt: summary.generated_at ?? undefined,
    };

    const description = buildIssueMarkdown(domainSummary, requirement.title, figmaUrls.length > 0 ? figmaUrls : undefined);

    const issue = await updateLinearIssue(req.linearToken!, {
      issueId: requirement.linear_issue_id,
      title: requirement.title,
      description,
    });

    console.info('[INFO] [linear:sync] Linear issue synced', JSON.stringify({
      requirementId,
      issueIdentifier: issue.identifier,
    }));

    res.status(200).json({ synced: true, issueIdentifier: issue.identifier });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [linear:sync] Failed to sync Linear issue', JSON.stringify({ requirementId, error: message }));
    res.status(500).json({ error: `Failed to sync Linear issue: ${message}` });
  }
});

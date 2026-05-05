import { Router } from 'express';
import { requireGitHub } from '../middleware/requireAuth';
import { supabase, createUserClient } from '../supabase';
import { GitHubClient, GitHubAuthError } from '../lib/githubClient';
import { analyzeRepo } from '../analysis/repoAnalyzer';
import type { FileTreeEntry, CommitEntry } from '../../shared/schemas/repoContext';
import crypto from 'crypto';

export const githubRouter = Router();
export const githubCallbackRouter = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.warn('[WARN] [github:init] GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set — GitHub repo connection will not work');
}

const KEY_FILE_PATTERNS = [
  'package.json',
  'README.md',
  'readme.md',
  'tsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'webpack.config.js',
  'webpack.config.ts',
  'next.config.js',
  'next.config.ts',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'Cargo.toml',
  'requirements.txt',
  'pyproject.toml',
  'go.mod',
  'Gemfile',
  'pom.xml',
  'build.gradle',
  '.github/workflows/ci.yml',
  '.github/workflows/ci.yaml',
  '.github/workflows/main.yml',
  '.github/workflows/deploy.yml',
  'Makefile',
  'turbo.json',
  'nx.json',
  'lerna.json',
];

const MAX_KEY_FILE_SIZE = 100_000;
const MAX_DEEP_FETCH_FILES = 50;

const pendingOAuthStates = new Map<string, { userId: string; expiresAt: number }>();

// --- OAuth Flow (server-side, for repo scope) ---

githubRouter.get('/auth', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'GitHub OAuth not configured on server' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingOAuthStates.set(state, {
    userId: req.user!.id,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/github/callback`,
    scope: 'repo',
    state,
  });

  console.info(
    `[INFO] [github:auth] Redirecting to GitHub OAuth`,
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
});

githubCallbackRouter.get('/', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    return res.redirect(`${APP_ORIGIN}?github_error=missing_params`);
  }

  const pending = pendingOAuthStates.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingOAuthStates.delete(state);
    return res.redirect(`${APP_ORIGIN}?github_error=invalid_state`);
  }

  pendingOAuthStates.delete(state);
  const { userId } = pending;

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      console.error(
        `[ERROR] [github:callback] Token exchange failed`,
        JSON.stringify({ error: tokenData.error }),
      );
      return res.redirect(`${APP_ORIGIN}?github_error=token_exchange_failed`);
    }

    const client = new GitHubClient({ token: tokenData.access_token });
    const githubUser = await client.request<{ id: number; login: string; avatar_url: string }>('/user');

    await supabase
      .from('github_connections')
      .upsert({
        user_id: userId,
        github_user_id: String(githubUser.id),
        github_username: githubUser.login,
        github_avatar_url: githubUser.avatar_url,
        access_token: tokenData.access_token,
        scopes: 'repo',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    console.info(
      `[INFO] [github:callback] GitHub connected successfully`,
      JSON.stringify({ userId, githubUsername: githubUser.login }),
    );

    res.redirect(`${APP_ORIGIN}?github_connected=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [github:callback] OAuth callback failed`,
      JSON.stringify({ userId, error: message }),
    );
    res.redirect(`${APP_ORIGIN}?github_error=callback_failed`);
  }
});

// --- Connection Management ---

githubRouter.get('/status', async (req, res) => {
  const { data, error } = await supabase
    .from('github_connections')
    .select('github_username, github_avatar_url, scopes, connected_at')
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    username: data.github_username,
    avatarUrl: data.github_avatar_url,
    scopes: data.scopes,
    connectedAt: data.connected_at,
  });
});

githubRouter.delete('/connect', async (req, res) => {
  const { error } = await supabase
    .from('github_connections')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) {
    console.error(
      `[ERROR] [github:disconnect] Failed to remove connection`,
      JSON.stringify({ userId: req.user!.id, error: error.message }),
    );
    return res.status(500).json({ error: 'Failed to disconnect GitHub' });
  }

  console.info(
    `[INFO] [github:disconnect] GitHub disconnected`,
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ connected: false });
});

// --- Repository Listing ---

githubRouter.get('/repos', requireGitHub, async (req, res) => {
  const client = new GitHubClient({ token: req.githubToken! });

  try {
    const repos = await client.request<Array<{
      id: number;
      full_name: string;
      private: boolean;
      default_branch: string;
      language: string | null;
      description: string | null;
    }>>('/user/repos?type=all&sort=updated&per_page=100');

    const mapped = repos.map(r => ({
      id: r.id,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch,
      language: r.language,
      description: r.description,
    }));

    res.json(mapped);
  } catch (err) {
    if (err instanceof GitHubAuthError) {
      return res.status(401).json({ error: 'GitHub token expired or revoked. Please reconnect.' });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [github:repos] Failed to fetch repos`,
      JSON.stringify({ userId: req.user!.id, error: message }),
    );
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// --- Codebase Fetching ---

githubRouter.post('/fetch/:projectId', requireGitHub, async (req, res) => {
  const { projectId } = req.params;
  const db = createUserClient(req.accessToken!);

  console.info(
    `[INFO] [github:fetch] Starting fetch`,
    JSON.stringify({ userId: req.user!.id, projectId }),
  );

  const { data: project, error: projError } = await db
    .from('projects')
    .select('github_repo_full_name, github_repo_default_branch')
    .eq('id', projectId)
    .single();

  if (projError || !project?.github_repo_full_name) {
    return res.status(400).json({ error: 'Project has no linked GitHub repository' });
  }

  const repoFullName = project.github_repo_full_name;
  const branch = project.github_repo_default_branch || 'main';
  const contextId = `rc-${projectId}`;

  await supabase
    .from('repo_contexts')
    .upsert({
      id: contextId,
      project_id: projectId,
      user_id: req.user!.id,
      file_tree: [],
      key_files: {},
      recent_commits: [],
      analysis: null,
      status: 'fetching',
      error_message: null,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'project_id' });

  const client = new GitHubClient({ token: req.githubToken! });

  try {
    const [owner, repo] = repoFullName.split('/');

    const treeData = await client.request<{
      tree: Array<{ path: string; type: string; size?: number }>;
    }>(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

    const fileTree: FileTreeEntry[] = treeData.tree.map(item => ({
      path: item.path,
      type: item.type === 'tree' ? 'tree' : 'blob',
      size: item.size,
    }));

    const keyFiles: Record<string, string> = {};
    const filePaths = fileTree.filter(f => f.type === 'blob').map(f => f.path);

    for (const pattern of KEY_FILE_PATTERNS) {
      const matchingPath = filePaths.find(p =>
        p === pattern || p.endsWith(`/${pattern}`),
      );
      if (matchingPath) {
        const entry = fileTree.find(f => f.path === matchingPath);
        if (entry && entry.size && entry.size > MAX_KEY_FILE_SIZE) continue;

        try {
          const fileData = await client.request<{ content: string; encoding: string }>(
            `/repos/${owner}/${repo}/contents/${matchingPath}?ref=${branch}`,
          );
          if (fileData.encoding === 'base64') {
            keyFiles[matchingPath] = Buffer.from(fileData.content, 'base64').toString('utf-8');
          }
        } catch {
          console.debug(`[DEBUG] [github:fetch] Skipped file ${matchingPath}`);
        }
      }
    }

    const commitsData = await client.request<Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
    }>>(`/repos/${owner}/${repo}/commits?per_page=50&sha=${branch}`);

    const recentCommits: CommitEntry[] = commitsData.map(c => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
    }));

    const analysis = analyzeRepo(fileTree, keyFiles, recentCommits);

    await supabase
      .from('repo_contexts')
      .update({
        file_tree: fileTree,
        key_files: keyFiles,
        recent_commits: recentCommits,
        analysis,
        status: 'ready',
        error_message: null,
        fetched_at: new Date().toISOString(),
      })
      .eq('id', contextId);

    console.info(
      `[INFO] [github:fetch] Fetch complete`,
      JSON.stringify({ projectId, filesInTree: fileTree.length, keyFilesCount: Object.keys(keyFiles).length }),
    );

    res.json({ status: 'ready', analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isAuthError = err instanceof GitHubAuthError;

    await supabase
      .from('repo_contexts')
      .update({
        status: 'error',
        error_message: isAuthError ? 'GitHub token expired or revoked' : message,
      })
      .eq('id', contextId);

    console.error(
      `[ERROR] [github:fetch] Fetch failed`,
      JSON.stringify({ projectId, error: message }),
    );

    const status = isAuthError ? 401 : 500;
    res.status(status).json({ error: message });
  }
});

// --- Deep Fetch ---

githubRouter.post('/fetch/:projectId/deep', requireGitHub, async (req, res) => {
  const { projectId } = req.params;
  const { paths } = req.body as { paths?: string[] };
  const db = createUserClient(req.accessToken!);

  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty "paths" array' });
  }

  console.info(
    `[INFO] [github:deepFetch] Starting deep fetch`,
    JSON.stringify({ projectId, paths }),
  );

  const { data: project, error: projError } = await db
    .from('projects')
    .select('github_repo_full_name, github_repo_default_branch')
    .eq('id', projectId)
    .single();

  if (projError || !project?.github_repo_full_name) {
    return res.status(400).json({ error: 'Project has no linked GitHub repository' });
  }

  const { data: repoContext } = await supabase
    .from('repo_contexts')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (!repoContext) {
    return res.status(400).json({ error: 'No repo context found. Run initial fetch first.' });
  }

  const repoFullName = project.github_repo_full_name;
  const branch = project.github_repo_default_branch || 'main';
  const [owner, repo] = repoFullName.split('/');
  const client = new GitHubClient({ token: req.githubToken! });

  try {
    const existingKeyFiles: Record<string, string> = repoContext.key_files || {};
    const fileTree: FileTreeEntry[] = repoContext.file_tree || [];

    const filesToFetch = fileTree.filter(f =>
      f.type === 'blob' &&
      paths.some(p => f.path.startsWith(p)) &&
      (!f.size || f.size <= MAX_KEY_FILE_SIZE) &&
      !existingKeyFiles[f.path],
    ).slice(0, MAX_DEEP_FETCH_FILES);

    for (const file of filesToFetch) {
      try {
        const fileData = await client.request<{ content: string; encoding: string }>(
          `/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
        );
        if (fileData.encoding === 'base64') {
          existingKeyFiles[file.path] = Buffer.from(fileData.content, 'base64').toString('utf-8');
        }
      } catch {
        console.debug(`[DEBUG] [github:deepFetch] Skipped file ${file.path}`);
      }
    }

    const recentCommits: CommitEntry[] = repoContext.recent_commits || [];
    const analysis = analyzeRepo(fileTree, existingKeyFiles, recentCommits);

    await supabase
      .from('repo_contexts')
      .update({
        key_files: existingKeyFiles,
        analysis,
        fetched_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);

    console.info(
      `[INFO] [github:deepFetch] Deep fetch complete`,
      JSON.stringify({ projectId, fetchedCount: filesToFetch.length }),
    );

    res.json({ status: 'ready', fetchedCount: filesToFetch.length, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [github:deepFetch] Deep fetch failed`,
      JSON.stringify({ projectId, error: message }),
    );
    res.status(500).json({ error: message });
  }
});

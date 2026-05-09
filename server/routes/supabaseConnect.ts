import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin, createUserClient } from '../supabase';
import { SupabaseManagementClient, SupabaseMgmtAuthError } from '../lib/supabaseManagementClient';
import { analyzeDb } from '../analysis/dbAnalyzer';
import type { DbTable, DbRelationship, DbFunction, EdgeFunction } from '../../shared/schemas/dbContext';
import crypto from 'crypto';

export const supabaseConnectRouter = Router();
export const supabaseConnectCallbackRouter = Router();

const SUPABASE_OAUTH_CLIENT_ID = process.env.SUPABASE_OAUTH_CLIENT_ID;
const SUPABASE_OAUTH_CLIENT_SECRET = process.env.SUPABASE_OAUTH_CLIENT_SECRET;
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

if (!SUPABASE_OAUTH_CLIENT_ID || !SUPABASE_OAUTH_CLIENT_SECRET) {
  console.warn('[WARN] [supabaseConnect:init] SUPABASE_OAUTH_CLIENT_ID or SUPABASE_OAUTH_CLIENT_SECRET not set — Supabase project connection will not work');
}

const pendingOAuthStates = new Map<string, { userId: string; codeVerifier: string; expiresAt: number }>();

// --- OAuth Flow ---

supabaseConnectRouter.get('/auth', (req, res) => {
  if (!SUPABASE_OAUTH_CLIENT_ID) {
    return res.status(500).json({ error: 'Supabase OAuth not configured on server' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  pendingOAuthStates.set(state, {
    userId: req.user!.id,
    codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const callbackUrl = `${req.protocol}://${req.get('host')}/api/supabase-connect/callback`;

  const params = new URLSearchParams({
    client_id: SUPABASE_OAUTH_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  console.info(
    `[INFO] [supabaseConnect:auth] Redirecting to Supabase OAuth`,
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ url: `https://api.supabase.com/v1/oauth/authorize?${params.toString()}` });
});

supabaseConnectCallbackRouter.get('/', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    return res.redirect(`${APP_ORIGIN}?supabase_connect_error=missing_params`);
  }

  const pending = pendingOAuthStates.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingOAuthStates.delete(state);
    return res.redirect(`${APP_ORIGIN}?supabase_connect_error=invalid_state`);
  }

  pendingOAuthStates.delete(state);
  const { userId, codeVerifier } = pending;

  const callbackUrl = `${req.protocol}://${req.get('host')}/api/supabase-connect/callback`;

  try {
    const tokenRes = await fetch('https://api.supabase.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${SUPABASE_OAUTH_CLIENT_ID}:${SUPABASE_OAUTH_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!tokenData.access_token || !tokenData.refresh_token) {
      console.error(
        `[ERROR] [supabaseConnect:callback] Token exchange failed`,
        JSON.stringify({ error: tokenData.error }),
      );
      return res.redirect(`${APP_ORIGIN}?supabase_connect_error=token_exchange_failed`);
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString();

    const client = new SupabaseManagementClient({ accessToken: tokenData.access_token });
    let orgId: string | null = null;
    let orgName: string | null = null;

    try {
      const orgs = await client.request<Array<{ id: string; name: string }>>('/v1/organizations');
      if (orgs.length > 0) {
        orgId = orgs[0].id;
        orgName = orgs[0].name;
      }
    } catch {
      console.debug('[DEBUG] [supabaseConnect:callback] Could not fetch org info');
    }

    await supabaseAdmin
      .from('supabase_connections')
      .upsert({
        user_id: userId,
        supabase_org_id: orgId,
        supabase_org_name: orgName,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        scopes: 'database:read,projects:read,organizations:read,edge_functions:read',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    console.info(
      `[INFO] [supabaseConnect:callback] Supabase connected successfully`,
      JSON.stringify({ userId, orgName }),
    );

    res.redirect(`${APP_ORIGIN}?supabase_connected=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [supabaseConnect:callback] OAuth callback failed`,
      JSON.stringify({ userId, error: message }),
    );
    res.redirect(`${APP_ORIGIN}?supabase_connect_error=callback_failed`);
  }
});

// --- Connection Management ---

supabaseConnectRouter.get('/status', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('supabase_connections')
    .select('supabase_org_id, supabase_org_name, scopes, connected_at')
    .eq('user_id', req.user!.id)
    .single();

  if (error || !data) {
    return res.json({ connected: false });
  }

  res.json({
    connected: true,
    orgId: data.supabase_org_id,
    orgName: data.supabase_org_name,
    scopes: data.scopes,
    connectedAt: data.connected_at,
  });
});

supabaseConnectRouter.delete('/connect', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('supabase_connections')
    .delete()
    .eq('user_id', req.user!.id);

  if (error) {
    console.error(
      `[ERROR] [supabaseConnect:disconnect] Failed to remove connection`,
      JSON.stringify({ userId: req.user!.id, error: error.message }),
    );
    return res.status(500).json({ error: 'Failed to disconnect Supabase' });
  }

  console.info(
    `[INFO] [supabaseConnect:disconnect] Supabase disconnected`,
    JSON.stringify({ userId: req.user!.id }),
  );

  res.json({ connected: false });
});

// --- Project Listing ---

supabaseConnectRouter.get('/projects', requireSupabaseConnect, async (req, res) => {
  const client = new SupabaseManagementClient({ accessToken: req.supabaseConnectToken! });

  try {
    const projects = await client.request<Array<{
      id: string;
      name: string;
      organization_id: string;
      region: string;
      status: string;
    }>>('/v1/projects');

    const active = projects
      .filter(p => p.status === 'ACTIVE_HEALTHY')
      .map(p => ({
        id: p.id,
        name: p.name,
        organizationId: p.organization_id,
        region: p.region,
      }));

    res.json(active);
  } catch (err) {
    if (err instanceof SupabaseMgmtAuthError) {
      return res.status(401).json({ error: 'Supabase token expired. Please reconnect.' });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[ERROR] [supabaseConnect:projects] Failed to fetch projects`,
      JSON.stringify({ userId: req.user!.id, error: message }),
    );
    res.status(500).json({ error: 'Failed to fetch Supabase projects' });
  }
});

// --- Schema Fetching ---

supabaseConnectRouter.post('/fetch/:projectId', requireSupabaseConnect, async (req, res) => {
  const { projectId } = req.params;
  const db = createUserClient(req.accessToken!);

  console.info(
    `[INFO] [supabaseConnect:fetch] Starting schema fetch`,
    JSON.stringify({ userId: req.user!.id, projectId }),
  );

  const { data: project, error: projError } = await db
    .from('projects')
    .select('supabase_project_ref')
    .eq('id', projectId)
    .single();

  if (projError || !project?.supabase_project_ref) {
    return res.status(400).json({ error: 'Project has no linked Supabase project' });
  }

  const projectRef = project.supabase_project_ref;
  const contextId = `dbc-${projectId}`;

  await supabaseAdmin
    .from('db_contexts')
    .upsert({
      id: contextId,
      project_id: projectId,
      user_id: req.user!.id,
      supabase_project_ref: projectRef,
      tables: [],
      relationships: [],
      functions: [],
      edge_functions: [],
      analysis: null,
      status: 'fetching',
      error_message: null,
      fetched_at: new Date().toISOString(),
    }, { onConflict: 'project_id' });

  const client = new SupabaseManagementClient({ accessToken: req.supabaseConnectToken! });

  try {
    const tables = await fetchTables(client, projectRef);
    const relationships = await fetchRelationships(client, projectRef);
    const functions = await fetchFunctions(client, projectRef);
    const edgeFunctions = await fetchEdgeFunctions(client, projectRef);

    const analysis = analyzeDb(tables, relationships, functions, edgeFunctions);

    await supabaseAdmin
      .from('db_contexts')
      .update({
        tables,
        relationships,
        functions,
        edge_functions: edgeFunctions,
        analysis,
        status: 'ready',
        error_message: null,
        fetched_at: new Date().toISOString(),
      })
      .eq('id', contextId);

    console.info(
      `[INFO] [supabaseConnect:fetch] Schema fetch complete`,
      JSON.stringify({ projectId, tableCount: tables.length, relationshipCount: relationships.length }),
    );

    res.json({ status: 'ready', analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isAuthError = err instanceof SupabaseMgmtAuthError;

    await supabaseAdmin
      .from('db_contexts')
      .update({
        status: 'error',
        error_message: isAuthError ? 'Supabase token expired or revoked' : message,
      })
      .eq('id', contextId);

    console.error(
      `[ERROR] [supabaseConnect:fetch] Schema fetch failed`,
      JSON.stringify({ projectId, error: message }),
    );

    const status = isAuthError ? 401 : 500;
    res.status(status).json({ error: message });
  }
});

// --- Data Fetching Helpers ---

async function fetchTables(client: SupabaseManagementClient, ref: string): Promise<DbTable[]> {
  const columnsQuery = `
    SELECT
      c.table_schema,
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key,
      CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END AS is_foreign_key,
      fk.foreign_table_name,
      fk.foreign_column_name
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT kcu.table_schema, kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.table_schema = pk.table_schema
      AND c.table_name = pk.table_name
      AND c.column_name = pk.column_name
    LEFT JOIN (
      SELECT
        kcu.table_schema,
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    ) fk ON c.table_schema = fk.table_schema
      AND c.table_name = fk.table_name
      AND c.column_name = fk.column_name
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
  `;

  const rlsQuery = `
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public';
  `;

  const rowCountQuery = `
    SELECT relname AS table_name, n_live_tup AS row_estimate
    FROM pg_stat_user_tables
    WHERE schemaname = 'public';
  `;

  const [columnsResult, rlsResult, rowCountResult] = await Promise.all([
    client.readOnlyQuery<Array<{
      table_schema: string;
      table_name: string;
      column_name: string;
      data_type: string;
      udt_name: string;
      is_nullable: string;
      column_default: string | null;
      is_primary_key: boolean;
      is_foreign_key: boolean;
      foreign_table_name: string | null;
      foreign_column_name: string | null;
    }>>(ref, columnsQuery),
    client.readOnlyQuery<Array<{ tablename: string; rowsecurity: boolean }>>(ref, rlsQuery),
    client.readOnlyQuery<Array<{ table_name: string; row_estimate: number }>>(ref, rowCountQuery),
  ]);

  const rlsMap = new Map(rlsResult.map(r => [r.tablename, r.rowsecurity]));
  const rowCountMap = new Map(rowCountResult.map(r => [r.table_name, r.row_estimate]));

  const tableMap = new Map<string, DbTable>();

  for (const row of columnsResult) {
    if (!tableMap.has(row.table_name)) {
      tableMap.set(row.table_name, {
        name: row.table_name,
        schema: row.table_schema,
        columns: [],
        rowCountEstimate: rowCountMap.get(row.table_name) ?? null,
        hasRls: rlsMap.get(row.table_name) ?? false,
      });
    }

    const table = tableMap.get(row.table_name)!;
    table.columns.push({
      name: row.column_name,
      type: row.udt_name || row.data_type,
      isNullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key,
      isForeignKey: row.is_foreign_key,
      references: row.is_foreign_key && row.foreign_table_name
        ? { table: row.foreign_table_name, column: row.foreign_column_name! }
        : null,
    });
  }

  return Array.from(tableMap.values());
}

async function fetchRelationships(client: SupabaseManagementClient, ref: string): Promise<DbRelationship[]> {
  const query = `
    SELECT
      tc.constraint_name,
      kcu.table_name AS from_table,
      kcu.column_name AS from_column,
      ccu.table_name AS to_table,
      ccu.column_name AS to_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
  `;

  const result = await client.readOnlyQuery<Array<{
    constraint_name: string;
    from_table: string;
    from_column: string;
    to_table: string;
    to_column: string;
  }>>(ref, query);

  return result.map(r => ({
    constraintName: r.constraint_name,
    fromTable: r.from_table,
    fromColumn: r.from_column,
    toTable: r.to_table,
    toColumn: r.to_column,
    type: 'one-to-many' as const,
  }));
}

async function fetchFunctions(client: SupabaseManagementClient, ref: string): Promise<DbFunction[]> {
  const query = `
    SELECT
      p.proname AS name,
      n.nspname AS schema,
      l.lanname AS language,
      pg_get_function_result(p.oid) AS return_type,
      pg_get_function_arguments(p.oid) AS argument_types
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname;
  `;

  const result = await client.readOnlyQuery<Array<{
    name: string;
    schema: string;
    language: string;
    return_type: string;
    argument_types: string;
  }>>(ref, query);

  return result.map(r => ({
    name: r.name,
    schema: r.schema,
    language: r.language,
    returnType: r.return_type,
    argumentTypes: r.argument_types,
  }));
}

async function fetchEdgeFunctions(client: SupabaseManagementClient, ref: string): Promise<EdgeFunction[]> {
  try {
    const result = await client.request<Array<{
      id: string;
      slug: string;
      name: string;
      status: string;
      version: number;
    }>>(`/v1/projects/${ref}/functions`);

    return result.map(f => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      status: f.status,
      version: f.version,
    }));
  } catch {
    console.debug('[DEBUG] [supabaseConnect:fetchEdgeFunctions] Could not fetch edge functions');
    return [];
  }
}

// --- Middleware ---

async function requireSupabaseConnect(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('supabase_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('user_id', req.user.id)
    .single();

  if (error || !data) {
    console.warn(
      `[WARN] [auth:requireSupabaseConnect] No Supabase connection found`,
      JSON.stringify({ userId: req.user.id }),
    );
    res.status(403).json({ error: 'Supabase project not connected. Please connect your Supabase account first.' });
    return;
  }

  const expiresAt = new Date(data.token_expires_at).getTime();
  const bufferMs = 5 * 60 * 1000;

  if (Date.now() > expiresAt - bufferMs) {
    console.info(
      `[INFO] [auth:requireSupabaseConnect] Token expired or expiring soon, refreshing`,
      JSON.stringify({ userId: req.user.id }),
    );

    try {
      const refreshRes = await fetch('https://api.supabase.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${SUPABASE_OAUTH_CLIENT_ID}:${SUPABASE_OAUTH_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: data.refresh_token,
        }),
      });

      const tokens = await refreshRes.json() as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        error?: string;
      };

      if (!tokens.access_token) {
        throw new Error(tokens.error || 'Token refresh returned no access_token');
      }

      const newExpiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

      await supabaseAdmin
        .from('supabase_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || data.refresh_token,
          token_expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', req.user.id);

      req.supabaseConnectToken = tokens.access_token;
    } catch (refreshErr) {
      const message = refreshErr instanceof Error ? refreshErr.message : 'Unknown error';
      console.error(
        `[ERROR] [auth:requireSupabaseConnect] Token refresh failed`,
        JSON.stringify({ userId: req.user.id, error: message }),
      );
      res.status(401).json({ error: 'Supabase token expired and refresh failed. Please reconnect.' });
      return;
    }
  } else {
    req.supabaseConnectToken = data.access_token;
  }

  next();
}

declare global {
  namespace Express {
    interface Request {
      supabaseConnectToken?: string;
    }
  }
}

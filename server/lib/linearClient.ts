const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_TOKEN_URL = 'https://api.linear.app/oauth/token';

async function graphql<T>(accessToken: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear API error ${res.status}: ${text}`);
  }

  const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };

  if (json.errors?.length) {
    throw new Error(`Linear GraphQL error: ${json.errors.map(e => e.message).join(', ')}`);
  }

  return json.data as T;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearProject {
  id: string;
  name: string;
}

export interface LinearIssueResult {
  id: string;
  identifier: string;
  url: string;
  state: { name: string; type: string };
}

export interface LinearViewer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface LinearTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function fetchLinearViewer(accessToken: string): Promise<LinearViewer> {
  const data = await graphql<{ viewer: LinearViewer }>(accessToken, `
    query {
      viewer {
        id
        displayName
        avatarUrl
      }
    }
  `);
  return data.viewer;
}

export async function listLinearTeams(accessToken: string): Promise<LinearTeam[]> {
  const data = await graphql<{ teams: { nodes: LinearTeam[] } }>(accessToken, `
    query {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  `);
  return data.teams.nodes;
}

export async function listLinearProjects(accessToken: string, teamId: string): Promise<LinearProject[]> {
  const data = await graphql<{ team: { projects: { nodes: LinearProject[] } } }>(accessToken, `
    query($teamId: String!) {
      team(id: $teamId) {
        projects {
          nodes {
            id
            name
          }
        }
      }
    }
  `, { teamId });
  return data.team.projects.nodes;
}

export async function createLinearIssue(accessToken: string, params: {
  teamId: string;
  projectId: string;
  title: string;
  description: string;
}): Promise<LinearIssueResult> {
  const data = await graphql<{
    issueCreate: {
      success: boolean;
      issue: LinearIssueResult;
    };
  }>(accessToken, `
    mutation($teamId: String!, $projectId: String!, $title: String!, $description: String!) {
      issueCreate(input: {
        teamId: $teamId
        projectId: $projectId
        title: $title
        description: $description
      }) {
        success
        issue {
          id
          identifier
          url
          state {
            name
            type
          }
        }
      }
    }
  `, params);

  if (!data.issueCreate.success) {
    throw new Error('Linear issue creation failed');
  }

  return data.issueCreate.issue;
}

export async function exchangeLinearCode(code: string, redirectUri: string): Promise<LinearTokenResponse> {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('LINEAR_CLIENT_ID or LINEAR_CLIENT_SECRET not configured');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(LINEAR_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear token exchange failed ${res.status}: ${text}`);
  }

  return res.json() as Promise<LinearTokenResponse>;
}

export async function refreshLinearToken(refreshToken: string): Promise<LinearTokenResponse> {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('LINEAR_CLIENT_ID or LINEAR_CLIENT_SECRET not configured');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(LINEAR_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear token refresh failed ${res.status}: ${text}`);
  }

  return res.json() as Promise<LinearTokenResponse>;
}

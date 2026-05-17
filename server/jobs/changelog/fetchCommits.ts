import { CHANGELOG_REPO, CHANGELOG_BRANCH, CHANGELOG_COMMITS_PER_PAGE } from '../changelogConfig';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

export async function fetchCommitsSince(since: string): Promise<GitHubCommit[]> {
  const url = `${GITHUB_API_BASE}/repos/${CHANGELOG_REPO}/commits?sha=${encodeURIComponent(CHANGELOG_BRANCH)}&since=${encodeURIComponent(since)}&per_page=${CHANGELOG_COMMITS_PER_PAGE}`;

  console.info('[INFO] [changelog:fetchCommits] Requesting GitHub commits', JSON.stringify({ repo: CHANGELOG_REPO, branch: CHANGELOG_BRANCH, since }));

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'arvid-changelog',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('[ERROR] [changelog:fetchCommits] GitHub API failed', JSON.stringify({ status: response.status, body: body.slice(0, 200) }));
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const commits = await response.json() as GitHubCommit[];
  console.info('[INFO] [changelog:fetchCommits] Fetched commits', JSON.stringify({ count: commits.length }));
  return commits;
}

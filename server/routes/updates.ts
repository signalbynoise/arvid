import { Router } from 'express';

export const updatesRouter = Router();

const GITHUB_REPO = 'signalbynoise/arvid';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

const CACHE_TTL_MS = 15 * 60 * 1000;
let cachedManifest: string | null = null;
let cachedAt = 0;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubAsset[];
}

function buildYaml(release: GitHubRelease): string {
  const version = release.tag_name.replace(/^v/, '');
  const dmgAsset = release.assets.find((a) => a.name.endsWith('.dmg'));
  const url = dmgAsset?.browser_download_url ?? '';
  const filename = dmgAsset?.name ?? `Arvid-${version}-arm64.dmg`;

  return [
    `version: ${version}`,
    `path: ${filename}`,
    `url: ${url}`,
  ].join('\n');
}

updatesRouter.get('/mac/latest-mac.yml', async (_req, res) => {
  const now = Date.now();

  if (cachedManifest && now - cachedAt < CACHE_TTL_MS) {
    res.type('text/yaml').send(cachedManifest);
    return;
  }

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'arvid-update-server',
      },
    });

    if (!response.ok) {
      console.error(`[error] [updates:manifest] GitHub API returned ${response.status}`);
      if (cachedManifest) {
        res.type('text/yaml').send(cachedManifest);
        return;
      }
      res.status(502).json({ error: 'Failed to fetch release info' });
      return;
    }

    const release = (await response.json()) as GitHubRelease;
    cachedManifest = buildYaml(release);
    cachedAt = now;

    res.type('text/yaml').send(cachedManifest);
  } catch (err) {
    console.error('[error] [updates:manifest] Failed to fetch from GitHub', err);
    if (cachedManifest) {
      res.type('text/yaml').send(cachedManifest);
      return;
    }
    res.status(502).json({ error: 'Failed to fetch release info' });
  }
});

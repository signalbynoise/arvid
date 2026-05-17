import { app, dialog, shell } from 'electron';
import { net } from 'electron';

const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 5_000;

const MANIFEST_URL = 'https://arvid-api.onrender.com/api/updates/mac/latest-mac.yml';

interface UpdateManifest {
  version: string;
  url: string;
}

function parseYaml(text: string): UpdateManifest | null {
  const versionMatch = text.match(/^version:\s*(.+)$/m);
  const urlMatch = text.match(/^url:\s*(.+)$/m);

  if (!versionMatch) return null;

  return {
    version: versionMatch[1].trim(),
    url: urlMatch ? urlMatch[1].trim() : '',
  };
}

function isNewerVersion(remote: string, current: string): boolean {
  const remoteParts = remote.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < Math.max(remoteParts.length, currentParts.length); i++) {
    const r = remoteParts[i] || 0;
    const c = currentParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  return false;
}

async function fetchUpdateManifest(): Promise<UpdateManifest | null> {
  return new Promise((resolve) => {
    const request = net.request(MANIFEST_URL);

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      let body = '';
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      response.on('end', () => {
        resolve(parseYaml(body));
      });
    });

    request.on('error', () => {
      resolve(null);
    });

    request.end();
  });
}

async function checkForUpdate(): Promise<void> {
  const manifest = await fetchUpdateManifest();
  if (!manifest || !manifest.url) return;

  const currentVersion = app.getVersion();
  if (!isNewerVersion(manifest.version, currentVersion)) return;

  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `A new version of Arvid is available (v${manifest.version}).`,
    detail: `You are currently running v${currentVersion}. Would you like to download the update?`,
    buttons: ['Download', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (response === 0) {
    shell.openExternal(manifest.url);
  }
}

export function startUpdateChecker(): void {
  setTimeout(() => {
    checkForUpdate().catch(() => {});
  }, INITIAL_DELAY_MS);

  setInterval(() => {
    checkForUpdate().catch(() => {});
  }, UPDATE_CHECK_INTERVAL_MS);
}

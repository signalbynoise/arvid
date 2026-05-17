import { dialog, BrowserWindow } from 'electron';
import { net } from 'electron';

const HEALTH_URL = 'https://arvid-api.onrender.com/api/health';
const POLL_INTERVAL_MS = 30_000;

let isShowingDialog = false;

function checkConnectivity(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!net.online) {
      resolve(false);
      return;
    }

    const request = net.request({ url: HEALTH_URL, method: 'HEAD' });

    const timeout = setTimeout(() => {
      request.abort();
      resolve(false);
    }, 10_000);

    request.on('response', (response) => {
      clearTimeout(timeout);
      resolve(response.statusCode === 200);
    });

    request.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });

    request.end();
  });
}

async function showOfflineDialog(getWindow: () => BrowserWindow | null): Promise<void> {
  if (isShowingDialog) return;
  isShowingDialog = true;

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Connection Lost',
    message: 'Arvid cannot reach the server.',
    detail: 'Check your internet connection and try again.',
    buttons: ['Retry', 'Quit'],
    defaultId: 0,
    cancelId: 1,
  });

  isShowingDialog = false;

  if (response === 1) {
    const { app } = require('electron');
    app.quit();
    return;
  }

  const online = await checkConnectivity();
  if (online) {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.reload();
    }
  } else {
    await showOfflineDialog(getWindow);
  }
}

export function watchNetwork(getWindow: () => BrowserWindow | null): void {
  setInterval(async () => {
    const online = await checkConnectivity();
    const win = getWindow();

    if (!online && win && !win.isDestroyed()) {
      win.webContents.send('network-status-changed', false);
      await showOfflineDialog(getWindow);
    }
  }, POLL_INTERVAL_MS);
}

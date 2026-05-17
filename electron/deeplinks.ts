import path from 'node:path';
import { app, BrowserWindow } from 'electron';

const PROTOCOL = 'arvid';

const APP_URL = process.env.ELECTRON_DEV
  ? 'http://localhost:5173'
  : 'https://app.arvid.work';

export function registerDeepLinkProtocol(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

export function handleDeepLinkUrl(win: BrowserWindow, url: string): void {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== `${PROTOCOL}:`) return;

    const routePath = parsed.pathname || '/';

    win.webContents.send('deep-link-navigation', routePath);
    win.loadURL(`${APP_URL}${routePath}`);

    if (win.isMinimized()) win.restore();
    win.focus();
  } catch {
    console.error('[electron:deeplinks] Failed to parse deep link URL:', url);
  }
}

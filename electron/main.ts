import { app, BrowserWindow, shell, session, nativeTheme, ipcMain } from 'electron';
import path from 'node:path';
import { buildMenu } from './menu';
import { createTray, destroyTray } from './tray';
import { restoreWindowState, trackWindowState } from './windowState';
import { registerDeepLinkProtocol, handleDeepLinkUrl } from './deeplinks';
import { startUpdateChecker } from './updater';
import { watchNetwork } from './network';

const APP_URL = process.env.ELECTRON_DEV
  ? 'http://localhost:5173'
  : 'https://app.arvid.work';

const APP_ORIGINS = [
  'https://app.arvid.work',
  'https://arvid.work',
  'https://arvid-api.onrender.com',
  'http://localhost:5173',
  'http://localhost:3001',
];

const OAUTH_PROVIDER_DOMAINS = [
  '.github.com',
  '.google.com',
  '.googleapis.com',
];

let mainWindow: BrowserWindow | null = null;

function isAppOrigin(url: string): boolean {
  return APP_ORIGINS.some(origin => url.startsWith(origin));
}

function clearOAuthSession(): Promise<void> {
  const ses = session.defaultSession;
  return Promise.all([
    ses.clearStorageData({ origin: 'https://github.com' }),
    ses.clearStorageData({ origin: 'https://accounts.google.com' }),
    ses.clearStorageData({ origin: 'https://www.google.com' }),
  ]).then(() => {});
}

function createWindow(): BrowserWindow {
  const savedBounds = restoreWindowState();

  const win = new BrowserWindow({
    ...savedBounds,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#08090a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  win.webContents.on('did-finish-load', () => {
    win.webContents.insertCSS(`
      #electron-titlebar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 38px;
        z-index: 99999;
        -webkit-app-region: drag;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-panel, #0f1011);
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.85);
        letter-spacing: 0;
        user-select: none;
        pointer-events: none;
      }
      html, body {
        overflow: hidden !important;
        height: 100% !important;
        margin: 0 !important;
      }
      #root {
        position: fixed !important;
        top: 38px !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        height: auto !important;
      }
      #root .h-screen {
        height: 100% !important;
      }
    `);
    win.webContents.executeJavaScript(`
      if (!document.getElementById('electron-titlebar')) {
        const bar = document.createElement('div');
        bar.id = 'electron-titlebar';
        bar.textContent = 'Arvid';
        document.body.prepend(bar);
      }
    `);
  });

  trackWindowState(win);

  win.webContents.on('will-navigate', (event, url) => {
    if (/\.supabase\.co\/auth\/v1\/authorize/.test(url)) {
      event.preventDefault();
      clearOAuthSession().then(() => {
        win.loadURL(url);
      });
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppOrigin(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.once('ready-to-show', () => {
    win.show();
    if (savedBounds.isMaximized) {
      win.maximize();
    }
  });

  win.loadURL(APP_URL);

  return win;
}

function setupPermissions(): void {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true);
  });
  ses.setPermissionCheckHandler(() => true);
  ses.setDevicePermissionHandler(() => true);
}

function setupIpc(): void {
  ipcMain.handle('get-system-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mainWindow?.webContents.send('system-theme-changed', theme);
  });
}

function getOrCreateWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return mainWindow;
  }
  mainWindow = createWindow();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  return mainWindow;
}

app.setName('Arvid');

if (app.dock) {
  app.dock.setIcon(path.join(__dirname, '..', '..', 'resources', 'icon.png'));
}

registerDeepLinkProtocol();

app.on('open-url', (_event, url) => {
  const win = getOrCreateWindow();
  handleDeepLinkUrl(win, url);
});

app.on('window-all-closed', () => {
  // Standard macOS behavior: keep app running when all windows are closed
});

app.on('activate', () => {
  getOrCreateWindow();
});

app.whenReady().then(() => {
  setupPermissions();
  setupIpc();
  buildMenu();

  mainWindow = createWindow();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createTray(() => getOrCreateWindow());
  watchNetwork(() => mainWindow);
  startUpdateChecker();
});

app.on('before-quit', () => {
  destroyTray();
});

export { mainWindow };

import { Tray, Menu, app, nativeImage, BrowserWindow } from 'electron';
import path from 'node:path';

let tray: Tray | null = null;

export function createTray(getWindow: () => BrowserWindow): void {
  const iconPath = path.join(__dirname, '..', '..', 'resources', 'tray-iconTemplate.png');
  let trayImage: Electron.NativeImage;

  try {
    trayImage = nativeImage.createFromPath(iconPath);
  } catch {
    trayImage = nativeImage.createEmpty();
  }

  trayImage.setTemplateImage(true);

  tray = new Tray(trayImage);
  tray.setToolTip('Arvid');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Arvid',
      click: () => {
        const win = getWindow();
        win.show();
        win.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Arvid',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    const win = getWindow();
    win.show();
    win.focus();
  });
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

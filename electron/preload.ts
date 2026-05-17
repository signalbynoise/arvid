import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemTheme: (): Promise<'dark' | 'light'> => {
    return ipcRenderer.invoke('get-system-theme');
  },

  onThemeChange: (callback: (theme: 'dark' | 'light') => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: 'dark' | 'light') => {
      callback(theme);
    };
    ipcRenderer.on('system-theme-changed', handler);
    return () => {
      ipcRenderer.removeListener('system-theme-changed', handler);
    };
  },

  getAppVersion: (): Promise<string> => {
    return ipcRenderer.invoke('get-app-version');
  },

  onDeepLink: (callback: (path: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => {
      callback(path);
    };
    ipcRenderer.on('deep-link-navigation', handler);
    return () => {
      ipcRenderer.removeListener('deep-link-navigation', handler);
    };
  },

  onNetworkStatus: (callback: (online: boolean) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, online: boolean) => {
      callback(online);
    };
    ipcRenderer.on('network-status-changed', handler);
    return () => {
      ipcRenderer.removeListener('network-status-changed', handler);
    };
  },
});

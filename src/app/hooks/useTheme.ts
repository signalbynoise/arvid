import { useSyncExternalStore, useCallback, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ElectronAPI {
  getSystemTheme: () => Promise<Theme>;
  onThemeChange: (callback: (theme: Theme) => void) => () => void;
  getAppVersion: () => Promise<string>;
  onDeepLink: (callback: (path: string) => void) => () => void;
  onNetworkStatus: (callback: (online: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const STORAGE_KEY = 'arvid-theme';
const CLASS_LIGHT = 'light';

let listeners: Array<() => void> = [];

function getSnapshot(): Theme {
  return document.documentElement.classList.contains(CLASS_LIGHT) ? 'light' : 'dark';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function applyTheme(theme: Theme): void {
  if (theme === 'light') {
    document.documentElement.classList.add(CLASS_LIGHT);
  } else {
    document.documentElement.classList.remove(CLASS_LIGHT);
  }
  listeners.forEach(l => l());
}

function resolveDefaultTheme(): Theme {
  return 'dark';
}

export function initTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored) {
    applyTheme(stored);
    return;
  }

  if (window.electronAPI) {
    window.electronAPI.getSystemTheme().then((systemTheme) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(systemTheme);
      }
    }).catch(() => {
      applyTheme(resolveDefaultTheme());
    });
  } else {
    applyTheme(resolveDefaultTheme());
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = getSnapshot() === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [setTheme]);

  useEffect(() => {
    if (!window.electronAPI) return;
    return window.electronAPI.onThemeChange((systemTheme) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(systemTheme);
      }
    });
  }, []);

  return { theme, setTheme, toggleTheme } as const;
}

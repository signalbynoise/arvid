import { useSyncExternalStore, useCallback } from 'react';

type Theme = 'dark' | 'light';

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

export function initTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  const resolved = stored === 'light' ? 'light' : 'dark';
  applyTheme(resolved);
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

  return { theme, setTheme, toggleTheme } as const;
}

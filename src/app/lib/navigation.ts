const STORAGE_KEY = 'arvid:navigation';

interface NavigationState {
  workspaceId: string | null;
  projectId: string | null;
}

export function saveNavigation(state: Partial<NavigationState>): void {
  try {
    const current = loadNavigation();
    const merged = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage unavailable (private browsing, storage full)
  }
}

export function loadNavigation(): NavigationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { workspaceId: null, projectId: null };
    const parsed = JSON.parse(raw);
    return {
      workspaceId: typeof parsed.workspaceId === 'string' ? parsed.workspaceId : null,
      projectId: typeof parsed.projectId === 'string' ? parsed.projectId : null,
    };
  } catch {
    return { workspaceId: null, projectId: null };
  }
}

export function clearNavigation(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

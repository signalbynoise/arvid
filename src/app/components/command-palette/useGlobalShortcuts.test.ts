import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalShortcuts, isEditableTarget } from './useGlobalShortcuts';
import { useStore } from '../../store';

vi.mock('../../api', () => ({
  api: {
    getGitHubAuthUrl: vi.fn().mockResolvedValue({ url: 'https://github.com/oauth' }),
    getLinearAuthUrl: vi.fn().mockResolvedValue({ url: 'https://linear.app/oauth' }),
    getSlackAuthUrl: vi.fn().mockResolvedValue({ url: 'https://slack.com/oauth' }),
    getProjects: vi.fn().mockResolvedValue([]),
    getRequirements: vi.fn().mockResolvedValue([]),
    getQuestions: vi.fn().mockResolvedValue([]),
    getAnswers: vi.fn().mockResolvedValue([]),
  },
}));

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
  document.dispatchEvent(event);
  return { event, preventDefaultSpy };
}

function fireChord(leader: string, second: string) {
  fireKey(leader);
  fireKey(second);
}

describe('useGlobalShortcuts — chord system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState({
      commandPaletteOpen: false,
      selectedProjectId: 'p1',
      selectedReqId: 'r1',
      selectedQuestionId: 'q1',
      activeWorkspaceId: 'ws1',
      projects: [{ id: 'p1', name: 'Test Project' }],
      requirements: [],
      questions: [],
      answers: [],
      githubConnection: { status: 'idle' },
      linearConnection: { status: 'idle' },
      slackConnection: { status: 'idle' },
      slackChannels: [],
      pendingModal: null,
      workspaces: [{ id: 'ws1', name: 'Test Workspace' }],
      teams: [{ id: 't1', name: 'Test Team', workspaceId: 'ws1' }],
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('chord execution', () => {
    it('C R creates a requirement', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'r');
      expect(useStore.getState().pendingModal?.type).toBe('createRequirement');
    });

    it('C P creates a project', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'p');
      expect(useStore.getState().pendingModal?.type).toBe('createProject');
    });

    it('C W creates a workspace', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'w');
      expect(useStore.getState().pendingModal?.type).toBe('createWorkspace');
    });

    it('C T creates a team', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 't');
      expect(useStore.getState().pendingModal?.type).toBe('createTeam');
    });

    it('C Q creates a question', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'q');
      expect(useStore.getState().pendingModal?.type).toBe('createQuestion');
    });

    it('C A creates an answer', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'a');
      expect(useStore.getState().pendingModal?.type).toBe('createAnswer');
    });

    it('C U W invites to workspace', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      fireKey('u');
      fireKey('w');
      expect(useStore.getState().pendingModal?.type).toBe('inviteMember');
      expect((useStore.getState().pendingModal?.data as any)?.scope).toBe('workspace');
    });

    it('C U T invites to team', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      fireKey('u');
      fireKey('t');
      expect(useStore.getState().pendingModal?.type).toBe('inviteMember');
      expect((useStore.getState().pendingModal?.data as any)?.scope).toBe('team');
    });

    it('C U P invites to project', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      fireKey('u');
      fireKey('p');
      expect(useStore.getState().pendingModal?.type).toBe('inviteMember');
      expect((useStore.getState().pendingModal?.data as any)?.scope).toBe('project');
    });

    it('E W renames workspace', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('e', 'w');
      const modal = useStore.getState().pendingModal;
      expect(modal?.type).toBe('renameEntity');
      expect((modal?.data as any)?.entityType).toBe('workspace');
      expect((modal?.data as any)?.entityId).toBe('ws1');
    });

    it('E P renames the currently selected project', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('e', 'p');
      const modal = useStore.getState().pendingModal;
      expect(modal?.type).toBe('renameEntity');
      expect((modal?.data as any)?.entityType).toBe('project');
      expect((modal?.data as any)?.entityId).toBe('p1');
    });

    it('E R renames the currently selected requirement', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('e', 'r');
      const modal = useStore.getState().pendingModal;
      expect(modal?.type).toBe('renameEntity');
      expect((modal?.data as any)?.entityType).toBe('requirement');
      expect((modal?.data as any)?.entityId).toBe('r1');
    });

    it('is case-insensitive', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('C');
      fireKey('R');
      expect(useStore.getState().pendingModal?.type).toBe('createRequirement');
    });
  });

  describe('chord timeout', () => {
    it('does not execute if second key comes after timeout', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      vi.advanceTimersByTime(1100);
      fireKey('r');
      expect(useStore.getState().pendingModal).toBeNull();
    });

    it('executes if second key comes within timeout', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      vi.advanceTimersByTime(500);
      fireKey('r');
      expect(useStore.getState().pendingModal?.type).toBe('createRequirement');
    });
  });

  describe('chord cancellation', () => {
    it('Escape cancels a pending chord', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      fireKey('Escape');
      fireKey('r');
      expect(useStore.getState().pendingModal).toBeNull();
    });
  });

  describe('focus guard', () => {
    it('does not activate leader key when input is focused', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      renderHook(() => useGlobalShortcuts());

      const event = new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: input });
      document.dispatchEvent(event);

      const event2 = new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true });
      Object.defineProperty(event2, 'target', { value: input });
      document.dispatchEvent(event2);

      expect(useStore.getState().pendingModal).toBeNull();
      document.body.removeChild(input);
    });

    it('does not activate when textarea is focused', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      renderHook(() => useGlobalShortcuts());

      const event = new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: textarea });
      document.dispatchEvent(event);

      expect(useStore.getState().pendingModal).toBeNull();
      document.body.removeChild(textarea);
    });
  });

  describe('palette-open guard', () => {
    it('does not activate chords when palette is open', () => {
      useStore.setState({ commandPaletteOpen: true } as any);
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'r');
      expect(useStore.getState().pendingModal).toBeNull();
    });
  });

  describe('modifier guard', () => {
    it('ignores keys with Cmd modifier', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c', { metaKey: true });
      fireKey('r');
      expect(useStore.getState().pendingModal).toBeNull();
    });

    it('ignores keys with Ctrl modifier', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c', { ctrlKey: true });
      fireKey('r');
      expect(useStore.getState().pendingModal).toBeNull();
    });

    it('ignores keys with Alt modifier', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c', { altKey: true });
      fireKey('r');
      expect(useStore.getState().pendingModal).toBeNull();
    });
  });

  describe('missing context', () => {
    it('opens palette when requirement chord used without project', () => {
      useStore.setState({ selectedProjectId: null } as any);
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'r');
      expect(useStore.getState().commandPaletteOpen).toBe(true);
      expect(useStore.getState().pendingModal).toBeNull();
    });

    it('opens palette when question chord used without requirement', () => {
      useStore.setState({ selectedReqId: null } as any);
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'q');
      expect(useStore.getState().commandPaletteOpen).toBe(true);
    });

    it('opens palette when team chord used without workspace', () => {
      useStore.setState({ activeWorkspaceId: null } as any);
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 't');
      expect(useStore.getState().commandPaletteOpen).toBe(true);
    });

    it('opens palette when invite-to-project used without project', () => {
      useStore.setState({ selectedProjectId: null } as any);
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      fireKey('u');
      fireKey('p');
      expect(useStore.getState().commandPaletteOpen).toBe(true);
    });
  });

  describe('unmatched chords', () => {
    it('does nothing for unregistered second key', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('c', 'z');
      expect(useStore.getState().pendingModal).toBeNull();
      expect(useStore.getState().commandPaletteOpen).toBe(false);
    });

    it('does nothing for non-leader first key', () => {
      renderHook(() => useGlobalShortcuts());
      fireChord('x', 'r');
      expect(useStore.getState().pendingModal).toBeNull();
    });
  });

  describe('preventDefault behavior', () => {
    it('prevents default on leader key press', () => {
      renderHook(() => useGlobalShortcuts());
      const { preventDefaultSpy } = fireKey('c');
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('prevents default on second key press', () => {
      renderHook(() => useGlobalShortcuts());
      fireKey('c');
      const { preventDefaultSpy } = fireKey('r');
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not prevent default for non-leader keys in idle state', () => {
      renderHook(() => useGlobalShortcuts());
      const { preventDefaultSpy } = fireKey('x');
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });
});

describe('isEditableTarget', () => {
  it('returns true for input elements', () => {
    const input = document.createElement('input');
    expect(isEditableTarget(input)).toBe(true);
  });

  it('returns true for textarea elements', () => {
    const textarea = document.createElement('textarea');
    expect(isEditableTarget(textarea)).toBe(true);
  });

  it('returns true for contentEditable elements', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    expect(isEditableTarget(div)).toBe(true);
  });

  it('returns false for regular div', () => {
    const div = document.createElement('div');
    expect(isEditableTarget(div)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isEditableTarget(null)).toBe(false);
  });
});

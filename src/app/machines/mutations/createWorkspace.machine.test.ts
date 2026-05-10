import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createCreateWorkspaceMachine,
  type CreateWorkspaceActions,
} from './createWorkspace.machine';

describe('createWorkspace machine', () => {
  let mockActions: {
    [K in keyof CreateWorkspaceActions]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      createWorkspace: vi.fn(),
      navigate: vi.fn(),
      buildWorkspacePath: vi.fn((slug: string) => `/${slug}`),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in idle state with empty context', () => {
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.name).toBe('');
    expect(snap.context.error).toBeNull();
    expect(snap.context.created).toBeNull();
  });

  it('transitions idle → submitting → success on successful creation', async () => {
    const workspace = { id: '1', slug: 'test-ws', name: 'Test' };
    mockActions.createWorkspace.mockResolvedValueOnce(workspace);
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test' });

    expect(actor.getSnapshot().value).toBe('submitting');

    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.createWorkspace).toHaveBeenCalledWith('Test');
    expect(mockActions.buildWorkspacePath).toHaveBeenCalledWith('test-ws');
    expect(mockActions.navigate).toHaveBeenCalledWith('/test-ws');
    expect(mockActions.onClose).toHaveBeenCalled();

    const snap = actor.getSnapshot();
    expect(snap.context.created).toEqual(workspace);
    expect(snap.context.error).toBeNull();
  });

  it('transitions idle → submitting → failure on rejected creation', async () => {
    mockActions.createWorkspace.mockRejectedValueOnce(new Error('Network error'));
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test' });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Network error');
    expect(mockActions.navigate).not.toHaveBeenCalled();
    expect(mockActions.onClose).not.toHaveBeenCalled();
  });

  it('transitions to failure when createWorkspace returns undefined', async () => {
    mockActions.createWorkspace.mockResolvedValueOnce(undefined);
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test' });
    await waitFor(actor, (s) => s.matches('failure'));

    expect(actor.getSnapshot().context.error).toBe(
      'Failed to create workspace. The name may already be taken.',
    );
  });

  it('prevents double-submit while in submitting state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.createWorkspace.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'First' });
    expect(actor.getSnapshot().value).toBe('submitting');

    actor.send({ type: 'SUBMIT', name: 'Second' });
    expect(actor.getSnapshot().value).toBe('submitting');
    expect(mockActions.createWorkspace).toHaveBeenCalledTimes(1);

    resolve!({ id: '1', slug: 'first', name: 'First' });
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to idle and clears context', async () => {
    mockActions.createWorkspace.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test' });
    await waitFor(actor, (s) => s.matches('failure'));
    expect(actor.getSnapshot().context.error).toBe('fail');

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
    expect(snap.context.name).toBe('');
    expect(snap.context.created).toBeNull();
  });

  it('stays in idle when SUBMIT has empty name (guard)', () => {
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: '' });
    expect(actor.getSnapshot().value).toBe('idle');

    actor.send({ type: 'SUBMIT', name: '   ' });
    expect(actor.getSnapshot().value).toBe('idle');

    expect(mockActions.createWorkspace).not.toHaveBeenCalled();
  });

  it('trims whitespace from name before submitting', async () => {
    const workspace = { id: '1', slug: 'trimmed', name: 'Trimmed' };
    mockActions.createWorkspace.mockResolvedValueOnce(workspace);
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: '  Trimmed  ' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(actor.getSnapshot().context.name).toBe('Trimmed');
    expect(mockActions.createWorkspace).toHaveBeenCalledWith('Trimmed');
  });

  it('allows retry from failure state', async () => {
    mockActions.createWorkspace.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateWorkspaceMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test' });
    await waitFor(actor, (s) => s.matches('failure'));

    const workspace = { id: '2', slug: 'retry', name: 'Retry' };
    mockActions.createWorkspace.mockResolvedValueOnce(workspace);
    actor.send({ type: 'SUBMIT', name: 'Retry' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.createWorkspace).toHaveBeenCalledTimes(2);
    expect(mockActions.navigate).toHaveBeenCalled();
  });
});

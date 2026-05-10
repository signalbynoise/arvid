import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createCreateTeamMachine,
  type CreateTeamActions,
} from './createTeam.machine';

describe('createTeam machine', () => {
  let mockActions: {
    [K in keyof CreateTeamActions]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      createTeam: vi.fn(),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in idle state with empty context', () => {
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.name).toBe('');
    expect(snap.context.error).toBeNull();
    expect(snap.context.created).toBeNull();
  });

  it('transitions idle → submitting → success on successful creation', async () => {
    const team = { id: 'tm-1', name: 'Engineering', workspaceId: 'ws-1' };
    mockActions.createTeam.mockResolvedValueOnce(team);
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Engineering', workspaceId: 'ws-1' });

    expect(actor.getSnapshot().value).toBe('submitting');
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.createTeam).toHaveBeenCalledWith('Engineering', 'ws-1');
    expect(mockActions.onClose).toHaveBeenCalled();
    expect(actor.getSnapshot().context.created).toEqual(team);
  });

  it('transitions idle → submitting → failure on rejected creation', async () => {
    mockActions.createTeam.mockRejectedValueOnce(new Error('Duplicate name'));
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test', workspaceId: 'ws-1' });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Duplicate name');
    expect(mockActions.onClose).not.toHaveBeenCalled();
  });

  it('transitions to failure when createTeam returns undefined', async () => {
    mockActions.createTeam.mockResolvedValueOnce(undefined);
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test', workspaceId: 'ws-1' });
    await waitFor(actor, (s) => s.matches('failure'));

    expect(actor.getSnapshot().context.error).toBe(
      'Failed to create team. The name may already be taken.',
    );
  });

  it('prevents double-submit while in submitting state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.createTeam.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'First', workspaceId: 'ws-1' });
    expect(actor.getSnapshot().value).toBe('submitting');

    actor.send({ type: 'SUBMIT', name: 'Second', workspaceId: 'ws-1' });
    expect(actor.getSnapshot().value).toBe('submitting');
    expect(mockActions.createTeam).toHaveBeenCalledTimes(1);

    resolve!({ id: 'tm-1', name: 'First', workspaceId: 'ws-1' });
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to idle and clears context', async () => {
    mockActions.createTeam.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test', workspaceId: 'ws-1' });
    await waitFor(actor, (s) => s.matches('failure'));

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
    expect(snap.context.name).toBe('');
    expect(snap.context.created).toBeNull();
    expect(snap.context.workspaceId).toBe('');
  });

  it('stays in idle when SUBMIT has empty name (guard)', () => {
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: '', workspaceId: 'ws-1' });
    expect(actor.getSnapshot().value).toBe('idle');

    actor.send({ type: 'SUBMIT', name: '   ', workspaceId: 'ws-1' });
    expect(actor.getSnapshot().value).toBe('idle');

    expect(mockActions.createTeam).not.toHaveBeenCalled();
  });

  it('trims whitespace from name before submitting', async () => {
    const team = { id: 'tm-1', name: 'Trimmed', workspaceId: 'ws-1' };
    mockActions.createTeam.mockResolvedValueOnce(team);
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: '  Trimmed  ', workspaceId: 'ws-1' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(actor.getSnapshot().context.name).toBe('Trimmed');
    expect(mockActions.createTeam).toHaveBeenCalledWith('Trimmed', 'ws-1');
  });

  it('allows retry from failure state', async () => {
    mockActions.createTeam.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateTeamMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'First', workspaceId: 'ws-1' });
    await waitFor(actor, (s) => s.matches('failure'));

    const team = { id: 'tm-2', name: 'Retry', workspaceId: 'ws-1' };
    mockActions.createTeam.mockResolvedValueOnce(team);
    actor.send({ type: 'SUBMIT', name: 'Retry', workspaceId: 'ws-1' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.createTeam).toHaveBeenCalledTimes(2);
  });
});

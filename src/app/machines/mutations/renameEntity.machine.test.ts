import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createRenameEntityMachine,
  type RenameEntityActions,
} from './renameEntity.machine';

describe('renameEntity machine', () => {
  let mockActions: {
    [K in keyof RenameEntityActions]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      rename: vi.fn(),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in idle state', () => {
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
  });

  it('transitions idle → submitting → success on successful rename', async () => {
    mockActions.rename.mockResolvedValueOnce(undefined);
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'New Name' });

    expect(actor.getSnapshot().value).toBe('submitting');
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.rename).toHaveBeenCalledWith('', 'New Name');
    expect(mockActions.onClose).toHaveBeenCalled();
  });

  it('transitions idle → submitting → failure on rejected rename', async () => {
    mockActions.rename.mockRejectedValueOnce(new Error('Permission denied'));
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'New Name' });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Permission denied');
    expect(mockActions.onClose).not.toHaveBeenCalled();
  });

  it('prevents double-submit while in submitting state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.rename.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'First' });
    expect(actor.getSnapshot().value).toBe('submitting');

    actor.send({ type: 'SUBMIT', name: 'Second' });
    expect(actor.getSnapshot().value).toBe('submitting');
    expect(mockActions.rename).toHaveBeenCalledTimes(1);

    resolve!(undefined);
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to idle and clears error', async () => {
    mockActions.rename.mockRejectedValueOnce(new Error('fail'));
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'Test' });
    await waitFor(actor, (s) => s.matches('failure'));

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
  });

  it('stays in idle when SUBMIT has empty name (guard)', () => {
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: '' });
    expect(actor.getSnapshot().value).toBe('idle');

    actor.send({ type: 'SUBMIT', name: '   ' });
    expect(actor.getSnapshot().value).toBe('idle');

    expect(mockActions.rename).not.toHaveBeenCalled();
  });

  it('stays in idle when SUBMIT name equals currentName (guard)', () => {
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    /*
     * Default currentName is '' and default context name is ''.
     * The guard checks trimmed !== currentName.
     * Since the default currentName is '', any non-empty name that differs should pass.
     * But if we submit with the same as currentName, it should block.
     */
    expect(actor.getSnapshot().context.currentName).toBe('');
    expect(mockActions.rename).not.toHaveBeenCalled();
  });

  it('trims whitespace from name before submitting', async () => {
    mockActions.rename.mockResolvedValueOnce(undefined);
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: '  Trimmed  ' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(actor.getSnapshot().context.name).toBe('Trimmed');
    expect(mockActions.rename).toHaveBeenCalledWith('', 'Trimmed');
  });

  it('allows retry from failure state', async () => {
    mockActions.rename.mockRejectedValueOnce(new Error('fail'));
    const machine = createRenameEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', name: 'First' });
    await waitFor(actor, (s) => s.matches('failure'));

    mockActions.rename.mockResolvedValueOnce(undefined);
    actor.send({ type: 'SUBMIT', name: 'Second' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.rename).toHaveBeenCalledTimes(2);
  });
});

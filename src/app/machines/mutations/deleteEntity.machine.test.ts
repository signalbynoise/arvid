import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createDeleteEntityMachine,
  type DeleteEntityActions,
} from './deleteEntity.machine';

describe('deleteEntity machine', () => {
  let mockActions: {
    [K in keyof Required<DeleteEntityActions>]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      deleteEntity: vi.fn(),
      onClose: vi.fn(),
      onSuccess: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in confirming state', () => {
    const machine = createDeleteEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('confirming');
    expect(snap.context.error).toBeNull();
  });

  it('transitions confirming → submitting → success on successful delete', async () => {
    mockActions.deleteEntity.mockResolvedValueOnce(undefined);
    const machine = createDeleteEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'CONFIRM' });

    expect(actor.getSnapshot().value).toBe('submitting');
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.deleteEntity).toHaveBeenCalled();
    expect(mockActions.onSuccess).toHaveBeenCalled();
    expect(mockActions.onClose).toHaveBeenCalled();
  });

  it('calls onClose even without onSuccess callback', async () => {
    const actionsWithoutOnSuccess: DeleteEntityActions = {
      deleteEntity: vi.fn().mockResolvedValueOnce(undefined),
      onClose: vi.fn(),
    };
    const machine = createDeleteEntityMachine(actionsWithoutOnSuccess);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'CONFIRM' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(actionsWithoutOnSuccess.onClose).toHaveBeenCalled();
  });

  it('transitions confirming → submitting → failure on rejected delete', async () => {
    mockActions.deleteEntity.mockRejectedValueOnce(new Error('Cannot delete'));
    const machine = createDeleteEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'CONFIRM' });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Cannot delete');
    expect(mockActions.onClose).not.toHaveBeenCalled();
    expect(mockActions.onSuccess).not.toHaveBeenCalled();
  });

  it('prevents double-confirm while in submitting state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.deleteEntity.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createDeleteEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'CONFIRM' });
    expect(actor.getSnapshot().value).toBe('submitting');

    actor.send({ type: 'CONFIRM' });
    expect(actor.getSnapshot().value).toBe('submitting');
    expect(mockActions.deleteEntity).toHaveBeenCalledTimes(1);

    resolve!(undefined);
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to confirming and clears error', async () => {
    mockActions.deleteEntity.mockRejectedValueOnce(new Error('fail'));
    const machine = createDeleteEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'CONFIRM' });
    await waitFor(actor, (s) => s.matches('failure'));
    expect(actor.getSnapshot().context.error).toBe('fail');

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('confirming');
    expect(snap.context.error).toBeNull();
  });

  it('allows retry from failure with CONFIRM', async () => {
    mockActions.deleteEntity.mockRejectedValueOnce(new Error('fail'));
    const machine = createDeleteEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'CONFIRM' });
    await waitFor(actor, (s) => s.matches('failure'));

    mockActions.deleteEntity.mockResolvedValueOnce(undefined);
    actor.send({ type: 'CONFIRM' });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.deleteEntity).toHaveBeenCalledTimes(2);
    expect(mockActions.onSuccess).toHaveBeenCalled();
    expect(mockActions.onClose).toHaveBeenCalled();
  });

  it('clears error when retrying from failure', async () => {
    mockActions.deleteEntity.mockRejectedValueOnce(new Error('first fail'));
    const machine = createDeleteEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'CONFIRM' });
    await waitFor(actor, (s) => s.matches('failure'));
    expect(actor.getSnapshot().context.error).toBe('first fail');

    mockActions.deleteEntity.mockResolvedValueOnce(undefined);
    actor.send({ type: 'CONFIRM' });

    expect(actor.getSnapshot().context.error).toBeNull();
    await waitFor(actor, (s) => s.matches('success'));
  });
});

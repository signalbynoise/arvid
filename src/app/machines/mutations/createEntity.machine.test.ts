import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createCreateEntityMachine,
  type CreateEntityActions,
} from './createEntity.machine';

describe('createEntity machine', () => {
  let mockActions: {
    [K in keyof CreateEntityActions]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      create: vi.fn(),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in idle state with null error', () => {
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
    expect(snap.context.entityType).toBe('question');
  });

  it('transitions idle → submitting → success on successful creation', async () => {
    mockActions.create.mockResolvedValueOnce(undefined);
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const payload = { title: 'Question?', projectId: 'p-1' };
    actor.send({ type: 'SUBMIT', payload });

    expect(actor.getSnapshot().value).toBe('submitting');
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.create).toHaveBeenCalledWith(payload);
    expect(mockActions.onClose).toHaveBeenCalled();
  });

  it('transitions idle → submitting → failure on rejected creation', async () => {
    mockActions.create.mockRejectedValueOnce(new Error('Validation failed'));
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', payload: { title: 'Bad' } });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Validation failed');
    expect(mockActions.onClose).not.toHaveBeenCalled();
  });

  it('prevents double-submit while in submitting state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.create.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', payload: { title: 'First' } });
    expect(actor.getSnapshot().value).toBe('submitting');

    actor.send({ type: 'SUBMIT', payload: { title: 'Second' } });
    expect(actor.getSnapshot().value).toBe('submitting');
    expect(mockActions.create).toHaveBeenCalledTimes(1);

    resolve!(undefined);
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to idle and clears error', async () => {
    mockActions.create.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', payload: { title: 'Test' } });
    await waitFor(actor, (s) => s.matches('failure'));
    expect(actor.getSnapshot().context.error).toBe('fail');

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
  });

  it('allows retry from failure with SUBMIT', async () => {
    mockActions.create.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', payload: { title: 'Bad' } });
    await waitFor(actor, (s) => s.matches('failure'));

    mockActions.create.mockResolvedValueOnce(undefined);
    actor.send({ type: 'SUBMIT', payload: { title: 'Good' } });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.create).toHaveBeenCalledTimes(2);
    expect(mockActions.onClose).toHaveBeenCalled();
  });

  it('clears error when retrying from failure', async () => {
    mockActions.create.mockRejectedValueOnce(new Error('first fail'));
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', payload: {} });
    await waitFor(actor, (s) => s.matches('failure'));
    expect(actor.getSnapshot().context.error).toBe('first fail');

    mockActions.create.mockResolvedValueOnce(undefined);
    actor.send({ type: 'SUBMIT', payload: {} });

    expect(actor.getSnapshot().context.error).toBeNull();
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('accepts SUBMIT with any payload (no guard)', () => {
    mockActions.create.mockReturnValueOnce(new Promise(() => {}));
    const machine = createCreateEntityMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'SUBMIT', payload: {} });
    expect(actor.getSnapshot().value).toBe('submitting');
  });
});

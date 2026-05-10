import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createLinkIntegrationMachine,
  type LinkIntegrationActions,
} from './linkIntegration.machine';

describe('linkIntegration machine', () => {
  let mockActions: {
    [K in keyof Required<LinkIntegrationActions>]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      link: vi.fn(),
      onLinked: vi.fn(),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in idle state with null error', () => {
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
    expect(snap.context.integrationType).toBe('github');
  });

  it('transitions idle → linking → success on successful link', async () => {
    mockActions.link.mockResolvedValueOnce(undefined);
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const payload = { token: 'abc', org: 'my-org' };
    actor.send({ type: 'LINK', payload });

    expect(actor.getSnapshot().value).toBe('linking');
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.link).toHaveBeenCalledWith(payload);
    expect(mockActions.onLinked).toHaveBeenCalled();
    expect(mockActions.onClose).toHaveBeenCalled();
  });

  it('calls onClose even without onLinked callback', async () => {
    const actionsWithoutOnLinked: LinkIntegrationActions = {
      link: vi.fn().mockResolvedValueOnce(undefined),
      onClose: vi.fn(),
    };
    const machine = createLinkIntegrationMachine(actionsWithoutOnLinked);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'LINK', payload: { token: 'abc' } });
    await waitFor(actor, (s) => s.matches('success'));

    expect(actionsWithoutOnLinked.onClose).toHaveBeenCalled();
  });

  it('transitions idle → linking → failure on rejected link', async () => {
    mockActions.link.mockRejectedValueOnce(new Error('Auth failed'));
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'LINK', payload: { token: 'bad' } });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Auth failed');
    expect(mockActions.onLinked).not.toHaveBeenCalled();
    expect(mockActions.onClose).not.toHaveBeenCalled();
  });

  it('prevents double-link while in linking state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.link.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'LINK', payload: { token: 'first' } });
    expect(actor.getSnapshot().value).toBe('linking');

    actor.send({ type: 'LINK', payload: { token: 'second' } });
    expect(actor.getSnapshot().value).toBe('linking');
    expect(mockActions.link).toHaveBeenCalledTimes(1);

    resolve!(undefined);
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to idle and clears error', async () => {
    mockActions.link.mockRejectedValueOnce(new Error('fail'));
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'LINK', payload: {} });
    await waitFor(actor, (s) => s.matches('failure'));
    expect(actor.getSnapshot().context.error).toBe('fail');

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
  });

  it('allows retry from failure with LINK', async () => {
    mockActions.link.mockRejectedValueOnce(new Error('fail'));
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'LINK', payload: { token: 'bad' } });
    await waitFor(actor, (s) => s.matches('failure'));

    mockActions.link.mockResolvedValueOnce(undefined);
    actor.send({ type: 'LINK', payload: { token: 'good' } });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.link).toHaveBeenCalledTimes(2);
    expect(mockActions.onLinked).toHaveBeenCalled();
  });

  it('clears error when retrying from failure', async () => {
    mockActions.link.mockRejectedValueOnce(new Error('first fail'));
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'LINK', payload: {} });
    await waitFor(actor, (s) => s.matches('failure'));
    expect(actor.getSnapshot().context.error).toBe('first fail');

    mockActions.link.mockResolvedValueOnce(undefined);
    actor.send({ type: 'LINK', payload: {} });

    expect(actor.getSnapshot().context.error).toBeNull();
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('accepts LINK with any payload (no guard)', () => {
    mockActions.link.mockReturnValueOnce(new Promise(() => {}));
    const machine = createLinkIntegrationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({ type: 'LINK', payload: {} });
    expect(actor.getSnapshot().value).toBe('linking');
  });
});

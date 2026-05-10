import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createSendInvitationMachine,
  type SendInvitationActions,
} from './sendInvitation.machine';

describe('sendInvitation machine', () => {
  let mockActions: {
    [K in keyof SendInvitationActions]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      sendInvitation: vi.fn(),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in idle state with empty context', () => {
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.email).toBe('');
    expect(snap.context.error).toBeNull();
  });

  it('transitions idle → submitting → success on successful send', async () => {
    const invitation = { id: 'inv-1', email: 'user@example.com' };
    mockActions.sendInvitation.mockResolvedValueOnce(invitation);
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'user@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });

    expect(actor.getSnapshot().value).toBe('submitting');
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.sendInvitation).toHaveBeenCalledWith('ws-1', {
      email: 'user@example.com',
      role: 'member',
      scope: 'workspace',
    });
    expect(mockActions.onClose).toHaveBeenCalled();
  });

  it('includes teamId in payload when scope is team', async () => {
    const invitation = { id: 'inv-2', email: 'dev@example.com' };
    mockActions.sendInvitation.mockResolvedValueOnce(invitation);
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'dev@example.com',
      workspaceId: 'ws-1',
      scope: 'team',
      scopeId: 'tm-1',
    });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.sendInvitation).toHaveBeenCalledWith('ws-1', {
      email: 'dev@example.com',
      role: 'member',
      scope: 'team',
      teamId: 'tm-1',
    });
  });

  it('includes projectId in payload when scope is project', async () => {
    const invitation = { id: 'inv-3', email: 'pm@example.com' };
    mockActions.sendInvitation.mockResolvedValueOnce(invitation);
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'pm@example.com',
      workspaceId: 'ws-1',
      scope: 'project',
      scopeId: 'proj-1',
    });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.sendInvitation).toHaveBeenCalledWith('ws-1', {
      email: 'pm@example.com',
      role: 'member',
      scope: 'project',
      projectId: 'proj-1',
    });
  });

  it('transitions idle → submitting → failure on rejected send', async () => {
    mockActions.sendInvitation.mockRejectedValueOnce(
      new Error('Rate limited'),
    );
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'user@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Rate limited');
    expect(mockActions.onClose).not.toHaveBeenCalled();
  });

  it('transitions to failure when sendInvitation returns undefined', async () => {
    mockActions.sendInvitation.mockResolvedValueOnce(undefined);
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'user@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    expect(actor.getSnapshot().context.error).toBe(
      'Failed to send invitation. The email may already be invited.',
    );
  });

  it('prevents double-submit while in submitting state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.sendInvitation.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'first@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    expect(actor.getSnapshot().value).toBe('submitting');

    actor.send({
      type: 'SUBMIT',
      email: 'second@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    expect(actor.getSnapshot().value).toBe('submitting');
    expect(mockActions.sendInvitation).toHaveBeenCalledTimes(1);

    resolve!({ id: 'inv-1', email: 'first@example.com' });
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to idle and clears context', async () => {
    mockActions.sendInvitation.mockRejectedValueOnce(new Error('fail'));
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'user@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
    expect(snap.context.email).toBe('');
  });

  it('stays in idle when SUBMIT has empty email (guard)', () => {
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: '',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    expect(actor.getSnapshot().value).toBe('idle');

    actor.send({
      type: 'SUBMIT',
      email: '   ',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    expect(actor.getSnapshot().value).toBe('idle');

    expect(mockActions.sendInvitation).not.toHaveBeenCalled();
  });

  it('trims whitespace from email before submitting', async () => {
    const invitation = { id: 'inv-1', email: 'user@example.com' };
    mockActions.sendInvitation.mockResolvedValueOnce(invitation);
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: '  user@example.com  ',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    await waitFor(actor, (s) => s.matches('success'));

    expect(actor.getSnapshot().context.email).toBe('user@example.com');
  });

  it('allows retry from failure state', async () => {
    mockActions.sendInvitation.mockRejectedValueOnce(new Error('fail'));
    const machine = createSendInvitationMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      email: 'user@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    const invitation = { id: 'inv-1', email: 'user@example.com' };
    mockActions.sendInvitation.mockResolvedValueOnce(invitation);
    actor.send({
      type: 'SUBMIT',
      email: 'user@example.com',
      workspaceId: 'ws-1',
      scope: 'workspace',
    });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.sendInvitation).toHaveBeenCalledTimes(2);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor, waitFor, type AnyActor } from 'xstate';
import {
  createCreateProjectMachine,
  type CreateProjectActions,
} from './createProject.machine';

const WORKSPACE = { id: 'ws-1', slug: 'ws', name: 'WS' };
const TEAM = { id: 'tm-1', name: 'Team', workspaceId: 'ws-1' };

describe('createProject machine', () => {
  let mockActions: {
    [K in keyof CreateProjectActions]: ReturnType<typeof vi.fn>;
  };
  let actor: AnyActor;

  beforeEach(() => {
    mockActions = {
      createProject: vi.fn(),
      navigate: vi.fn(),
      getState: vi.fn(() => ({
        workspaces: [WORKSPACE],
        teams: [TEAM],
        activeWorkspaceId: 'ws-1',
      })),
      buildProjectPath: vi.fn(() => '/ws/team/project'),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    actor?.stop();
  });

  it('starts in idle state with empty context', () => {
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.name).toBe('');
    expect(snap.context.error).toBeNull();
    expect(snap.context.created).toBeNull();
  });

  it('transitions idle → submitting → success on successful creation', async () => {
    const project = { id: 'p-1', name: 'My Project', slug: 'my-project' };
    mockActions.createProject.mockResolvedValueOnce(project);
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: 'My Project',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });

    expect(actor.getSnapshot().value).toBe('submitting');
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.createProject).toHaveBeenCalledWith(
      'My Project',
      undefined,
      'ws-1',
      'tm-1',
    );
    expect(mockActions.getState).toHaveBeenCalled();
    expect(mockActions.buildProjectPath).toHaveBeenCalledWith(
      WORKSPACE,
      [TEAM],
      project,
    );
    expect(mockActions.navigate).toHaveBeenCalledWith('/ws/team/project');
    expect(mockActions.onClose).toHaveBeenCalled();
    expect(actor.getSnapshot().context.created).toEqual(project);
  });

  it('passes parentId when provided', async () => {
    const project = { id: 'p-2', name: 'Sub', slug: 'sub' };
    mockActions.createProject.mockResolvedValueOnce(project);
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: 'Sub',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
      parentId: 'parent-1',
    });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.createProject).toHaveBeenCalledWith(
      'Sub',
      'parent-1',
      'ws-1',
      'tm-1',
    );
  });

  it('transitions idle → submitting → failure on rejected creation', async () => {
    mockActions.createProject.mockRejectedValueOnce(new Error('Server error'));
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: 'Test',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('failure');
    expect(snap.context.error).toBe('Server error');
    expect(mockActions.navigate).not.toHaveBeenCalled();
    expect(mockActions.onClose).not.toHaveBeenCalled();
  });

  it('transitions to failure when createProject returns undefined', async () => {
    mockActions.createProject.mockResolvedValueOnce(undefined);
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: 'Test',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    expect(actor.getSnapshot().context.error).toBe(
      'Failed to create project. The name may already be taken.',
    );
  });

  it('prevents double-submit while in submitting state', async () => {
    let resolve: (v: unknown) => void;
    mockActions.createProject.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: 'First',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    expect(actor.getSnapshot().value).toBe('submitting');

    actor.send({
      type: 'SUBMIT',
      name: 'Second',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    expect(actor.getSnapshot().value).toBe('submitting');
    expect(mockActions.createProject).toHaveBeenCalledTimes(1);

    resolve!({ id: 'p-1', name: 'First', slug: 'first' });
    await waitFor(actor, (s) => s.matches('success'));
  });

  it('resets from failure to idle and clears context', async () => {
    mockActions.createProject.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: 'Test',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    actor.send({ type: 'RESET' });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.error).toBeNull();
    expect(snap.context.name).toBe('');
    expect(snap.context.created).toBeNull();
    expect(snap.context.workspaceId).toBe('');
    expect(snap.context.teamId).toBe('');
    expect(snap.context.parentId).toBeUndefined();
  });

  it('stays in idle when SUBMIT has empty name (guard)', () => {
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: '',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    expect(actor.getSnapshot().value).toBe('idle');

    actor.send({
      type: 'SUBMIT',
      name: '   ',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    expect(actor.getSnapshot().value).toBe('idle');

    expect(mockActions.createProject).not.toHaveBeenCalled();
  });

  it('allows retry from failure state', async () => {
    mockActions.createProject.mockRejectedValueOnce(new Error('fail'));
    const machine = createCreateProjectMachine(mockActions);
    actor = createActor(machine);
    actor.start();

    actor.send({
      type: 'SUBMIT',
      name: 'First',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    await waitFor(actor, (s) => s.matches('failure'));

    const project = { id: 'p-2', name: 'Retry', slug: 'retry' };
    mockActions.createProject.mockResolvedValueOnce(project);
    actor.send({
      type: 'SUBMIT',
      name: 'Retry',
      workspaceId: 'ws-1',
      teamId: 'tm-1',
    });
    await waitFor(actor, (s) => s.matches('success'));

    expect(mockActions.createProject).toHaveBeenCalledTimes(2);
  });
});

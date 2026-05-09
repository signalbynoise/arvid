import { StateCreator } from 'zustand';
import { Workspace, Team, Membership, Invitation } from '../../types';
import { api } from '../../api';
import { logger } from '../../logger';

const log = logger.create('store:workspaces');

export type WorkspacesDataStatus = 'idle' | 'loading' | 'ready' | 'error';
export type AcceptInvitationsStatus = 'idle' | 'resolving' | 'resolved' | 'error';

export interface WorkspacesDataState {
  status: WorkspacesDataStatus;
  error?: string;
}

export interface WorkspacesSlice {
  workspaces: Workspace[];
  workspacesDataState: WorkspacesDataState;
  activeWorkspaceId: string | null;

  teams: Team[];
  teamsDataState: WorkspacesDataState;

  members: Membership[];
  membersDataState: WorkspacesDataState;

  loadWorkspaces: () => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace | undefined>;
  updateWorkspace: (id: string, updates: { name?: string; logoUrl?: string | null }) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  loadTeams: (workspaceId: string) => Promise<void>;
  createTeam: (name: string, workspaceId: string) => Promise<Team | undefined>;
  updateTeam: (id: string, name: string) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;

  loadMembers: (workspaceId: string) => Promise<void>;
  addMember: (workspaceId: string, email: string, role: string) => Promise<Membership | undefined>;
  updateMemberRole: (id: string, role: string) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  leaveWorkspace: (workspaceId: string, membershipId: string) => Promise<boolean>;

  deactivationMap: {
    isOwner: boolean;
    workspace: boolean;
    teams: Record<string, boolean>;
    projects: Record<string, boolean>;
  };
  loadDeactivationMap: (workspaceId: string) => Promise<void>;

  invitations: Invitation[];
  invitationsDataState: WorkspacesDataState;
  acceptInvitationsState: { status: AcceptInvitationsStatus };

  loadInvitations: (workspaceId: string) => Promise<void>;
  sendInvitation: (workspaceId: string, opts: { teamId?: string; projectId?: string; scope?: string; email: string; role: string }) => Promise<Invitation | undefined>;
  cancelInvitation: (id: string) => Promise<void>;
  acceptPendingInvitations: () => Promise<void>;
}

export const createWorkspacesSlice: StateCreator<WorkspacesSlice, [], [], WorkspacesSlice> = (set, get) => ({
  workspaces: [],
  workspacesDataState: { status: 'idle' },
  activeWorkspaceId: null,

  teams: [],
  teamsDataState: { status: 'idle' },

  members: [],
  membersDataState: { status: 'idle' },

  deactivationMap: { isOwner: false, workspace: false, teams: {}, projects: {} },

  loadDeactivationMap: async (workspaceId: string) => {
    log.debug('loadDeactivationMap', 'Fetching deactivation eligibility', { workspaceId });
    try {
      const map = await api.getDeactivationMap(workspaceId);
      set({ deactivationMap: map });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('loadDeactivationMap', 'Failed to load deactivation map', { error: message });
    }
  },

  loadWorkspaces: async () => {
    set({ workspacesDataState: { status: 'loading' } });
    log.info('loadWorkspaces', 'Fetching workspaces');

    try {
      let workspaces = await api.getWorkspaces();

      if (workspaces.length === 0) {
        log.info('loadWorkspaces', 'No workspaces found, creating personal workspace');
        const personal = await api.createWorkspace('My Workspace');
        workspaces = [{ ...personal, userRole: 'owner' as const }];
      }

      set({ workspaces, workspacesDataState: { status: 'ready' } });
      log.info('loadWorkspaces', 'Workspaces loaded', { count: workspaces.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ workspacesDataState: { status: 'error', error: message } });
      log.error('loadWorkspaces', 'Failed to load workspaces', { error: message });
    }
  },

  setActiveWorkspace: (id: string) => {
    log.info('setActiveWorkspace', 'Switching workspace', { id });
    set({
      activeWorkspaceId: id,
      projects: [],
      projectsDataState: { status: 'idle' },
      teams: [],
      teamsDataState: { status: 'idle' },
      members: [],
      membersDataState: { status: 'idle' },
      invitations: [],
      invitationsDataState: { status: 'idle' },
    });
  },

  createWorkspace: async (name: string) => {
    log.info('createWorkspace', 'Creating workspace', { name });

    try {
      const created = await api.createWorkspace(name);
      const withRole = { ...created, userRole: 'owner' as const };
      set(state => ({
        workspaces: [...state.workspaces, withRole],
        activeWorkspaceId: withRole.id,
      }));
      log.info('createWorkspace', 'Workspace created', { id: withRole.id });
      return withRole;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createWorkspace', 'Failed to create workspace', { error: message });
      return undefined;
    }
  },

  updateWorkspace: async (id: string, updates: { name?: string; logoUrl?: string | null }): Promise<string | undefined> => {
    log.info('updateWorkspace', 'Updating workspace', { id, ...updates });

    const previous = get().workspaces;
    set(state => ({
      workspaces: state.workspaces.map(w => w.id === id ? { ...w, ...updates } : w),
    }));

    try {
      const apiUpdates: { name?: string; logo_url?: string | null } = {};
      if (updates.name !== undefined) apiUpdates.name = updates.name;
      if (updates.logoUrl !== undefined) apiUpdates.logo_url = updates.logoUrl;
      await api.updateWorkspace(id, apiUpdates);
      return undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('updateWorkspace', 'Failed to update workspace, rolling back', { error: message });
      set({ workspaces: previous });
      return message;
    }
  },

  deleteWorkspace: async (id: string) => {
    log.info('deleteWorkspace', 'Deleting workspace', { id });

    const { workspaces: previous, activeWorkspaceId } = get();
    const remaining = previous.filter(w => w.id !== id);

    const updates: Partial<WorkspacesSlice> = { workspaces: remaining };
    if (activeWorkspaceId === id) {
      updates.activeWorkspaceId = remaining[0]?.id ?? null;
      updates.teams = [];
      updates.members = [];
    }
    set(updates);

    try {
      await api.deleteWorkspace(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('deleteWorkspace', 'Failed to delete workspace, rolling back', { error: message });
      set({ workspaces: previous, activeWorkspaceId });
    }
  },

  loadTeams: async (workspaceId: string) => {
    set({ teamsDataState: { status: 'loading' } });
    log.info('loadTeams', 'Fetching teams', { workspaceId });

    try {
      const teams = await api.getTeams(workspaceId);
      set({ teams, teamsDataState: { status: 'ready' } });
      log.info('loadTeams', 'Teams loaded', { count: teams.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ teamsDataState: { status: 'error', error: message } });
      log.error('loadTeams', 'Failed to load teams', { error: message });
    }
  },

  createTeam: async (name: string, workspaceId: string) => {
    log.info('createTeam', 'Creating team', { name, workspaceId });

    try {
      const created = await api.createTeam(name, workspaceId);
      set(state => ({ teams: [...state.teams, created] }));
      log.info('createTeam', 'Team created', { id: created.id });
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('createTeam', 'Failed to create team', { error: message });
      return undefined;
    }
  },

  updateTeam: async (id: string, name: string) => {
    log.info('updateTeam', 'Updating team', { id, name });

    const previous = get().teams;
    set(state => ({
      teams: state.teams.map(t => t.id === id ? { ...t, name } : t),
    }));

    try {
      await api.updateTeam(id, { name });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('updateTeam', 'Failed to update team, rolling back', { error: message });
      set({ teams: previous });
    }
  },

  deleteTeam: async (id: string) => {
    log.info('deleteTeam', 'Deleting team', { id });

    const previous = get().teams;
    set(state => ({ teams: state.teams.filter(t => t.id !== id) }));

    try {
      await api.deleteTeam(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('deleteTeam', 'Failed to delete team, rolling back', { error: message });
      set({ teams: previous });
    }
  },

  loadMembers: async (workspaceId: string) => {
    set({ membersDataState: { status: 'loading' } });
    log.info('loadMembers', 'Fetching members', { workspaceId });

    try {
      const members = await api.getMembers(workspaceId);
      set({ members, membersDataState: { status: 'ready' } });
      log.info('loadMembers', 'Members loaded', { count: members.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ membersDataState: { status: 'error', error: message } });
      log.error('loadMembers', 'Failed to load members', { error: message });
    }
  },

  addMember: async (workspaceId: string, email: string, role: string) => {
    log.info('addMember', 'Adding member', { workspaceId, email, role });

    try {
      const created = await api.addMember(workspaceId, email, role);
      set(state => ({ members: [...state.members, created] }));
      log.info('addMember', 'Member added', { id: created.id });
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('addMember', 'Failed to add member', { error: message });
      return undefined;
    }
  },

  updateMemberRole: async (id: string, role: string) => {
    log.info('updateMemberRole', 'Updating member role', { id, role });

    const previous = get().members;
    set(state => ({
      members: state.members.map(m => m.id === id ? { ...m, role: role as Membership['role'] } : m),
    }));

    try {
      await api.updateMemberRole(id, role);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('updateMemberRole', 'Failed to update member role, rolling back', { error: message });
      set({ members: previous });
    }
  },

  removeMember: async (id: string) => {
    log.info('removeMember', 'Removing member', { id });

    const previous = get().members;
    set(state => ({ members: state.members.filter(m => m.id !== id) }));

    try {
      await api.removeMember(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('removeMember', 'Failed to remove member, rolling back', { error: message });
      set({ members: previous });
    }
  },

  leaveWorkspace: async (workspaceId: string, _membershipId: string) => {
    log.info('leaveWorkspace', 'Leaving workspace', { workspaceId });

    try {
      await api.leaveWorkspace(workspaceId);

      const remaining = get().workspaces.filter(w => w.id !== workspaceId);
      set({
        workspaces: remaining,
        activeWorkspaceId: remaining[0]?.id ?? null,
        teams: [],
        members: [],
        invitations: [],
      });

      if (remaining.length > 0) {
        get().loadWorkspaces();
      } else {
        log.info('leaveWorkspace', 'No workspaces remaining, will auto-create on reload');
        get().loadWorkspaces();
      }

      log.info('leaveWorkspace', 'Left workspace', { workspaceId });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('leaveWorkspace', 'Failed to leave workspace', { error: message });
      return false;
    }
  },

  invitations: [],
  invitationsDataState: { status: 'idle' },
  acceptInvitationsState: { status: 'idle' },

  loadInvitations: async (workspaceId: string) => {
    set({ invitationsDataState: { status: 'loading' } });
    log.info('loadInvitations', 'Fetching invitations', { workspaceId });

    try {
      const invitations = await api.getInvitations(workspaceId);
      set({ invitations, invitationsDataState: { status: 'ready' } });
      log.info('loadInvitations', 'Invitations loaded', { count: invitations.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ invitationsDataState: { status: 'error', error: message } });
      log.error('loadInvitations', 'Failed to load invitations', { error: message });
    }
  },

  sendInvitation: async (workspaceId: string, opts: { teamId?: string; projectId?: string; scope?: string; email: string; role: string }) => {
    log.info('sendInvitation', 'Sending invitation', { workspaceId, scope: opts.scope, role: opts.role });

    try {
      const created = await api.sendInvitation(workspaceId, opts);
      set(state => ({ invitations: [created, ...state.invitations] }));
      log.info('sendInvitation', 'Invitation sent', { id: created.id });
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('sendInvitation', 'Failed to send invitation', { error: message });
      return undefined;
    }
  },

  cancelInvitation: async (id: string) => {
    log.info('cancelInvitation', 'Cancelling invitation', { id });

    const previous = get().invitations;
    set(state => ({ invitations: state.invitations.filter(i => i.id !== id) }));

    try {
      await api.cancelInvitation(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('cancelInvitation', 'Failed to cancel invitation, rolling back', { error: message });
      set({ invitations: previous });
    }
  },

  acceptPendingInvitations: async () => {
    const current = get().acceptInvitationsState.status;
    if (current === 'resolving' || current === 'resolved') return;

    set({ acceptInvitationsState: { status: 'resolving' } });
    log.info('acceptPendingInvitations', 'Resolving pending invitations');

    try {
      const accepted = await api.acceptInvitations();

      if (accepted.length > 0) {
        log.info('acceptPendingInvitations', 'Invitations accepted, pre-loading workspaces', { count: accepted.length });
        const workspaces = await api.getWorkspaces();
        set({
          workspaces,
          workspacesDataState: { status: 'ready' },
          activeWorkspaceId: accepted[0].workspaceId,
          acceptInvitationsState: { status: 'resolved' },
        });
      } else {
        log.debug('acceptPendingInvitations', 'No pending invitations found');
        set({ acceptInvitationsState: { status: 'resolved' } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ acceptInvitationsState: { status: 'error' } });
      log.error('acceptPendingInvitations', 'Failed to accept invitations', { error: message });
    }
  },
});

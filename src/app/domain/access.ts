import type { WorkspaceRole } from '../types';

type AccessRole = WorkspaceRole | 'admin' | 'member' | undefined;

export const ROLE_RANK: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
  guest: 0,
};

export function hasMinimumRole(role: WorkspaceRole | undefined, required: WorkspaceRole): boolean {
  if (!role) return false;
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[required] ?? 0);
}

export function getEffectiveRole(
  workspaceRole?: AccessRole,
  teamRole?: AccessRole,
  projectRole?: AccessRole,
): WorkspaceRole | undefined {
  const roles = [workspaceRole, teamRole, projectRole].filter(Boolean) as string[];
  if (roles.length === 0) return undefined;

  return roles.reduce((best, current) =>
    (ROLE_RANK[current] ?? 0) > (ROLE_RANK[best] ?? 0) ? current : best,
  ) as WorkspaceRole;
}

export type AccessScope = 'workspace' | 'team' | 'project';

export function canManageAtLevel(role: WorkspaceRole | undefined, _level: AccessScope): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK['admin'];
}

export function canViewAtLevel(role: WorkspaceRole | undefined): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK['member'];
}

export function canRenameWorkspace(role: WorkspaceRole | undefined): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canInviteToWorkspace(role: WorkspaceRole | undefined): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canCreateTeam(role: WorkspaceRole | undefined): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canManageProject(role: WorkspaceRole | undefined): boolean {
  return hasMinimumRole(role, 'member');
}

export function canMoveProject(role: WorkspaceRole | undefined): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canDeleteWorkspace(role: WorkspaceRole | undefined): boolean {
  return role === 'owner';
}

export function canChangeRoles(role: WorkspaceRole | undefined): boolean {
  return role === 'owner';
}

export function canOpenWorkspaceSettings(role: WorkspaceRole | undefined): boolean {
  return hasMinimumRole(role, 'member');
}

export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    guest: 'Guest',
  };
  return labels[role];
}

export function getScopeLabel(scope: AccessScope): string {
  const labels: Record<AccessScope, string> = {
    workspace: 'Workspace',
    team: 'Team',
    project: 'Project',
  };
  return labels[scope];
}

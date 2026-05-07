import type { WorkspaceRole } from '../types';

type AccessRole = WorkspaceRole | 'admin' | 'member' | undefined;

const ROLE_RANK: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

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

export function getScopeLabel(scope: AccessScope): string {
  const labels: Record<AccessScope, string> = {
    workspace: 'Workspace',
    team: 'Team',
    project: 'Project',
  };
  return labels[scope];
}

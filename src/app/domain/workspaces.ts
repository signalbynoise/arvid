import { WorkspaceRole } from '../types';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function hasMinimumRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageTeams(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export function canChangeRoles(role: WorkspaceRole): boolean {
  return role === 'owner';
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === 'owner';
}

export function getRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };
  return labels[role];
}

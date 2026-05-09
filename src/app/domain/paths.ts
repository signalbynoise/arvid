import type { Workspace, Team, Project } from '../types';

export function buildWorkspacePath(workspaceShortId: string): string {
  return `/${workspaceShortId}`;
}

export function buildTeamPath(wsShortId: string, teamShortId: string): string {
  return `/${wsShortId}/${teamShortId}`;
}

export function buildProjectPath(wsShortId: string, teamShortId: string, projectShortId: string): string {
  return `/${wsShortId}/${teamShortId}/${projectShortId}`;
}

export function buildRequirementPath(wsShortId: string, teamShortId: string, projectShortId: string, reqShortId: string): string {
  return `/${wsShortId}/${teamShortId}/${projectShortId}/${reqShortId}`;
}

export function buildQuestionPath(wsShortId: string, teamShortId: string, projectShortId: string, reqShortId: string, qShortId: string): string {
  return `/${wsShortId}/${teamShortId}/${projectShortId}/${reqShortId}/${qShortId}`;
}

export function buildProjectPathFromEntities(
  workspace: Workspace,
  teams: Team[],
  project: Project,
): string | null {
  const team = teams.find(t => t.id === project.teamId);
  if (!team) return null;
  return buildProjectPath(
    workspace.slug,
    team.shortId!,
    project.shortId ?? project.id,
  );
}

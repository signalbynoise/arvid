import { describe, it, expect } from 'vitest';
import { buildWorkspacePath, buildTeamPath, buildProjectPath, buildProjectPathFromEntities } from './paths';
import type { Workspace, Team, Project } from '../types';

describe('buildWorkspacePath', () => {
  it('builds a workspace path from short ID', () => {
    expect(buildWorkspacePath('W01')).toBe('/W01');
  });

  it('handles any short ID format', () => {
    expect(buildWorkspacePath('W99')).toBe('/W99');
  });
});

describe('buildTeamPath', () => {
  it('builds a workspace + team path', () => {
    expect(buildTeamPath('W01', 'T01')).toBe('/W01/T01');
  });
});

describe('buildProjectPath', () => {
  it('builds a full three-level path', () => {
    expect(buildProjectPath('W01', 'T01', 'P01')).toBe('/W01/T01/P01');
  });

  it('works with higher numbers', () => {
    expect(buildProjectPath('W02', 'T03', 'P15')).toBe('/W02/T03/P15');
  });
});

describe('buildProjectPathFromEntities', () => {
  const workspace: Workspace = {
    id: 'ws-1',
    name: 'Arvid',
    slug: 'arvid',
    shortId: 'W01',
    createdBy: 'u-1',
    createdAt: '2026-01-01',
    isDeleted: false,
  };

  const teams: Team[] = [
    { id: 'tm-1', workspaceId: 'ws-1', name: 'Sweden', slug: 'sweden', shortId: 'T01', createdBy: 'u-1', createdAt: '2026-01-01', isDeleted: false },
    { id: 'tm-2', workspaceId: 'ws-1', name: 'Norway', slug: 'norway', shortId: 'T02', createdBy: 'u-1', createdAt: '2026-01-01', isDeleted: false },
  ];

  it('uses workspace slug for the URL segment', () => {
    const project = { id: 'p1', name: 'Test', shortId: 'P-4NRQ', teamId: 'tm-1' } as Project;
    expect(buildProjectPathFromEntities(workspace, teams, project)).toBe('/arvid/T01/P-4NRQ');
  });

  it('resolves second team correctly', () => {
    const project = { id: 'p2', name: 'Test2', shortId: 'P-X3KM', teamId: 'tm-2' } as Project;
    expect(buildProjectPathFromEntities(workspace, teams, project)).toBe('/arvid/T02/P-X3KM');
  });

  it('falls back to T00 when team is not found', () => {
    const project = { id: 'p3', name: 'Test3', shortId: 'P-7MVL', teamId: 'unknown' } as Project;
    expect(buildProjectPathFromEntities(workspace, teams, project)).toBe('/arvid/T00/P-7MVL');
  });

  it('falls back to project id when shortId is missing', () => {
    const project = { id: 'p-legacy', name: 'Legacy' } as Project;
    expect(buildProjectPathFromEntities(workspace, teams, project)).toBe('/arvid/T00/p-legacy');
  });
});

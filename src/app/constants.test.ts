import { describe, it, expect } from 'vitest';
import { API_BASE, DEFAULT_PROJECTS } from './constants';

describe('constants', () => {
  it('API_BASE is a valid path string', () => {
    expect(API_BASE).toBe('/api');
  });

  it('DEFAULT_PROJECTS has the expected structure', () => {
    expect(DEFAULT_PROJECTS.length).toBeGreaterThan(0);
    expect(DEFAULT_PROJECTS[0]).toHaveProperty('id');
    expect(DEFAULT_PROJECTS[0]).toHaveProperty('name');
    expect(DEFAULT_PROJECTS[0]).toHaveProperty('subProjects');
  });

  it('each project has a unique id', () => {
    const ids = DEFAULT_PROJECTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

import { describe, it, expect } from 'vitest';
import { buildProjectTree } from './projects';
import { Project } from '../types';

describe('buildProjectTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildProjectTree([])).toEqual([]);
  });

  it('returns top-level projects as roots', () => {
    const projects: Project[] = [
      { id: 'p1', name: 'Alpha' },
      { id: 'p2', name: 'Beta' },
    ];
    const tree = buildProjectTree(projects);
    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe('p1');
    expect(tree[1].id).toBe('p2');
  });

  it('nests children under parents', () => {
    const projects: Project[] = [
      { id: 'p1', name: 'Alpha' },
      { id: 'p1-1', name: 'Sub Alpha', parentId: 'p1' },
      { id: 'p1-2', name: 'Sub Beta', parentId: 'p1' },
    ];
    const tree = buildProjectTree(projects);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].name).toBe('Sub Alpha');
    expect(tree[0].children[1].name).toBe('Sub Beta');
  });

  it('handles multi-level nesting', () => {
    const projects: Project[] = [
      { id: 'p1', name: 'Root' },
      { id: 'p2', name: 'Child', parentId: 'p1' },
      { id: 'p3', name: 'Grandchild', parentId: 'p2' },
    ];
    const tree = buildProjectTree(projects);
    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].children[0].name).toBe('Grandchild');
  });

  it('treats orphaned children as roots', () => {
    const projects: Project[] = [
      { id: 'p1', name: 'Orphan', parentId: 'nonexistent' },
    ];
    const tree = buildProjectTree(projects);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('Orphan');
  });

  it('children array is empty for leaf nodes', () => {
    const projects: Project[] = [
      { id: 'p1', name: 'Leaf' },
    ];
    const tree = buildProjectTree(projects);
    expect(tree[0].children).toEqual([]);
  });
});

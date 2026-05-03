import { Project } from '../types';

export interface ProjectTreeNode {
  id: string;
  name: string;
  parentId?: string;
  children: ProjectTreeNode[];
}

export function buildProjectTree(projects: Project[]): ProjectTreeNode[] {
  const nodeMap = new Map<string, ProjectTreeNode>();

  for (const p of projects) {
    nodeMap.set(p.id, {
      id: p.id,
      name: p.name,
      parentId: p.parentId,
      children: [],
    });
  }

  const roots: ProjectTreeNode[] = [];

  for (const p of projects) {
    const node = nodeMap.get(p.id)!;
    if (p.parentId) {
      const parent = nodeMap.get(p.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

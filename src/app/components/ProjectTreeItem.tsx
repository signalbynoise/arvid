import React from 'react';
import { SidebarItem } from './SidebarItem';
import { ProjectIcon } from './ProjectIcon';
import { ProjectItemMenu } from './ProjectItemMenu';
import type { ProjectTreeNode } from '../domain/projects';

const DEPTH_INDENT_PX = 24;

interface ProjectTreeItemProps {
  node: ProjectTreeNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (nodeId: string) => void;
  onToggleExpand: (e: React.MouseEvent, nodeId: string) => void;
  onAddUser: (nodeId: string, nodeName: string) => void;
  onRename: (nodeId: string, nodeName: string) => void;
  onCreateSubProject: (nodeId: string, teamId?: string) => void;
  onDeactivate: (nodeId: string, nodeName: string) => void;
  getTeamId: (nodeId: string) => string | undefined;
  expandedMap: Record<string, boolean>;
  selectedProjectId: string | null;
}

export function ProjectTreeItem({
  node,
  depth,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onAddUser,
  onRename,
  onCreateSubProject,
  onDeactivate,
  getTeamId,
  expandedMap,
  selectedProjectId,
}: ProjectTreeItemProps) {
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <SidebarItem
        label={node.name}
        icon={<ProjectIcon depth={depth} isSelected={isSelected} />}
        isSelected={isSelected}
        indent={depth * DEPTH_INDENT_PX}
        chevron={hasChildren ? { open: !!isExpanded, onToggle: (e) => onToggleExpand(e, node.id) } : undefined}
        onClick={() => onSelect(node.id)}
        actions={
          <ProjectItemMenu
            projectId={node.id}
            onAddUser={() => onAddUser(node.id, node.name)}
            onRename={() => onRename(node.id, node.name)}
            onMove={() => {}}
            onCreateSubProject={depth === 0 ? () => onCreateSubProject(node.id, getTeamId(node.id)) : undefined}
            onSettings={() => {}}
            onDeactivate={() => onDeactivate(node.id, node.name)}
          />
        }
      />

      {isExpanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map(child => (
            <ProjectTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              isSelected={selectedProjectId === child.id}
              isExpanded={!!expandedMap[child.id]}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddUser={onAddUser}
              onRename={onRename}
              onCreateSubProject={onCreateSubProject}
              onDeactivate={onDeactivate}
              getTeamId={getTeamId}
              expandedMap={expandedMap}
              selectedProjectId={selectedProjectId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Network } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { TeamItemMenu } from './TeamItemMenu';
import { ProjectTreeItem } from './ProjectTreeItem';
import { buildProjectTree } from '../domain/projects';
import type { Team, Project } from '../types';
import type { ProjectTreeNode } from '../domain/projects';

const EXPAND_VARIANTS = {
  collapsed: { height: 0, opacity: 0, overflow: 'hidden' as const },
  expanded: { height: 'auto', opacity: 1, overflow: 'hidden' as const },
};

const EXPAND_TRANSITION = {
  height: { type: 'spring' as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

interface TeamSectionProps {
  teams: Team[];
  projectsByTeam: Map<string, Project[]>;
  ungroupedProjects: Project[];
  tree: ProjectTreeNode[];
  expandedMap: Record<string, boolean>;
  teamExpandedMap: Record<string, boolean>;
  selectedProjectId: string | null;
  onSelectProject: (nodeId: string) => void;
  onToggleExpand: (e: React.MouseEvent, nodeId: string) => void;
  onToggleTeamExpand: (e: React.MouseEvent, teamId: string) => void;
  onAddUserToProject: (nodeId: string, nodeName: string) => void;
  onAddUserToTeam: (teamId: string, teamName: string) => void;
  onRenameProject: (nodeId: string, nodeName: string) => void;
  onRenameTeam: (teamId: string, teamName: string) => void;
  onCreateSubProject: (nodeId: string, teamId?: string) => void;
  onCreateProjectInTeam: (teamId: string) => void;
  onDeactivateProject: (nodeId: string, nodeName: string) => void;
  onDeactivateTeam: (teamId: string, teamName: string) => void;
  getTeamId: (nodeId: string) => string | undefined;
}

export function TeamSection({
  teams,
  projectsByTeam,
  ungroupedProjects,
  tree,
  expandedMap,
  teamExpandedMap,
  selectedProjectId,
  onSelectProject,
  onToggleExpand,
  onToggleTeamExpand,
  onAddUserToProject,
  onAddUserToTeam,
  onRenameProject,
  onRenameTeam,
  onCreateSubProject,
  onCreateProjectInTeam,
  onDeactivateProject,
  onDeactivateTeam,
  getTeamId,
}: TeamSectionProps) {
  if (teams.length === 0) {
    return (
      <div className="space-y-0.5">
        {tree.map(node => (
          <ProjectTreeItem
            key={node.id}
            node={node}
            depth={0}
            isSelected={selectedProjectId === node.id}
            isExpanded={!!expandedMap[node.id]}
            onSelect={onSelectProject}
            onToggleExpand={onToggleExpand}
            onAddUser={onAddUserToProject}
            onRename={onRenameProject}
            onCreateSubProject={onCreateSubProject}
            onDeactivate={onDeactivateProject}
            getTeamId={getTeamId}
            expandedMap={expandedMap}
            selectedProjectId={selectedProjectId}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map(team => {
        const teamProjects = projectsByTeam.get(team.id) ?? [];
        const teamProjectTree = buildProjectTree(teamProjects);
        const isTeamExpanded = teamExpandedMap[team.id] ?? true;

        return (
          <div key={team.id}>
            <SidebarItem
              itemId={`team-${team.id}`}
              label={team.name}
              icon={<Network size={14} className="text-text-quaternary shrink-0" />}
              chevron={teamProjectTree.length > 0 ? { open: isTeamExpanded, onToggle: (e) => onToggleTeamExpand(e, team.id) } : undefined}
              actions={
                <TeamItemMenu
                  teamId={team.id}
                  onAddUser={() => onAddUserToTeam(team.id, team.name)}
                  onRename={() => onRenameTeam(team.id, team.name)}
                  onMove={() => {}}
                  onCreateProject={() => onCreateProjectInTeam(team.id)}
                  onSettings={() => {}}
                  onDeactivate={() => onDeactivateTeam(team.id, team.name)}
                />
              }
            />

            <AnimatePresence initial={false}>
              {isTeamExpanded && teamProjectTree.length > 0 && (
                <motion.div
                  key="team-projects"
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={EXPAND_VARIANTS}
                  transition={EXPAND_TRANSITION}
                  className="space-y-0.5"
                >
                  {teamProjectTree.map(node => (
                    <ProjectTreeItem
                      key={node.id}
                      node={node}
                      depth={1}
                      isSelected={selectedProjectId === node.id}
                      isExpanded={!!expandedMap[node.id]}
                      onSelect={onSelectProject}
                      onToggleExpand={onToggleExpand}
                      onAddUser={onAddUserToProject}
                      onRename={onRenameProject}
                      onCreateSubProject={onCreateSubProject}
                      onDeactivate={onDeactivateProject}
                      getTeamId={getTeamId}
                      expandedMap={expandedMap}
                      selectedProjectId={selectedProjectId}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {ungroupedProjects.length > 0 && (
        <div>
          <div className="flex items-center px-4 mb-1">
            <span className="text-caption-lg text-text-quaternary">
              Ungrouped
            </span>
          </div>
          <div className="space-y-0.5">
            {buildProjectTree(ungroupedProjects).map(node => (
              <ProjectTreeItem
                key={node.id}
                node={node}
                depth={0}
                isSelected={selectedProjectId === node.id}
                isExpanded={!!expandedMap[node.id]}
                onSelect={onSelectProject}
                onToggleExpand={onToggleExpand}
                onAddUser={onAddUserToProject}
                onRename={onRenameProject}
                onCreateSubProject={onCreateSubProject}
                onDeactivate={onDeactivateProject}
                getTeamId={getTeamId}
                expandedMap={expandedMap}
                selectedProjectId={selectedProjectId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

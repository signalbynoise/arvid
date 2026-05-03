import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Hash, Loader2 } from 'lucide-react';
import { IconButton } from './IconButton';
import { NewProjectModal } from './NewProjectModal';
import { RenameProjectModal } from './RenameProjectModal';
import { DeleteProjectModal } from './DeleteProjectModal';
import { ProjectItemMenu } from './ProjectItemMenu';
import { useStore, selectProjects, selectSelectedProjectId } from '../store';
import { buildProjectTree, ProjectTreeNode } from '../domain/projects';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const projects = useStore(selectProjects);
  const projectsDataState = useStore(s => s.projectsDataState);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);
  const loadProjects = useStore(s => s.loadProjects);

  const tree = useMemo(() => buildProjectTree(projects), [projects]);

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasChildren: boolean } | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      const firstRoot = projects.find(p => !p.parentId);
      if (firstRoot) {
        setSelectedProjectId(firstRoot.id);
      }
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (projects.length > 0) {
      const roots = projects.filter(p => !p.parentId);
      const hasChildren = roots.reduce<Record<string, boolean>>((acc, root) => {
        const children = projects.filter(p => p.parentId === root.id);
        if (children.length > 0) acc[root.id] = true;
        return acc;
      }, {});
      setExpandedProjects(prev => {
        const updated = { ...prev };
        for (const id of Object.keys(hasChildren)) {
          if (!(id in updated)) updated[id] = true;
        }
        return updated;
      });
    }
  }, [projects]);

  if (!isOpen) return null;

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreate = (parentId?: string) => {
    setCreateParentId(parentId);
    setIsCreateOpen(true);
  };

  const openRename = (id: string, name: string) => {
    setRenameTarget({ id, name });
    setIsRenameOpen(true);
  };

  const openDelete = (node: ProjectTreeNode) => {
    setDeleteTarget({ id: node.id, name: node.name, hasChildren: node.children.length > 0 });
    setIsDeleteOpen(true);
  };

  const renderNode = (node: ProjectTreeNode, depth = 0) => {
    const isExpanded = expandedProjects[node.id];
    const isSelected = selectedProjectId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div 
          onClick={() => setSelectedProjectId(node.id)}
          className={`group flex items-center justify-between py-1.5 px-2 mx-2 rounded-comfortable cursor-pointer text-[13px] font-[var(--fw-medium)] transition-colors ${
            isSelected 
              ? 'bg-surface-frost-08 text-text-primary' 
              : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
          }`}
          style={{ '--depth': depth } as React.CSSProperties}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <button 
              onClick={(e) => hasChildren ? toggleExpand(e, node.id) : undefined}
              className={`p-0.5 rounded-standard hover:bg-surface-frost-10 transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {depth === 0 ? <Folder size={14} className={isSelected ? 'text-text-primary' : 'text-text-quaternary'} /> : <Hash size={14} className={isSelected ? 'text-text-primary' : 'text-text-quaternary'} />}
            <span className="truncate">{node.name}</span>
          </div>
          
          <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              onClick={(e) => { e.stopPropagation(); openCreate(node.id); }}
              title="Add sub-project"
            >
              <Plus size={14} />
            </IconButton>
            <ProjectItemMenu
              onAddSubProject={() => openCreate(node.id)}
              onRename={() => openRename(node.id, node.name)}
              onDelete={() => openDelete(node)}
            />
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[240px] h-full flex-shrink-0 bg-surface-panel border-r border-border-subtle flex flex-col z-20">
      <div className="h-14 flex items-center px-4 border-b border-border-subtle shrink-0">
        <img src="/logo_wide.svg" alt="Arvid" className="h-5" />
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar py-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Projects</span>
          <IconButton onClick={() => openCreate()} title="New Project">
            <Plus size={14} />
          </IconButton>
        </div>
        
        {projectsDataState.status === 'loading' && projects.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="text-text-quaternary animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Folder size={24} className="mx-auto mb-2 text-text-quaternary opacity-60" />
            <p className="text-[12px] text-text-empty mb-3">No projects yet.</p>
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-surface-frost-06 hover:bg-surface-frost-10 border border-border-default rounded-comfortable text-[12px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Plus size={12} />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {tree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      <NewProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultParentId={createParentId}
      />

      {renameTarget && (
        <RenameProjectModal
          isOpen={isRenameOpen}
          onClose={() => { setIsRenameOpen(false); setRenameTarget(null); }}
          projectId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}

      {deleteTarget && (
        <DeleteProjectModal
          isOpen={isDeleteOpen}
          onClose={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}
          projectId={deleteTarget.id}
          projectName={deleteTarget.name}
          hasChildren={deleteTarget.hasChildren}
        />
      )}
    </div>
  );
}

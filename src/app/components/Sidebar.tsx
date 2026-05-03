import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Hash, LoaderPinwheel, Loader2 } from 'lucide-react';
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
          className={`group flex items-center justify-between py-1.5 px-2 mx-2 rounded-[6px] cursor-pointer text-[13px] font-[510] transition-colors ${
            isSelected 
              ? 'bg-[rgba(255,255,255,0.08)] text-[#f7f8f8]' 
              : 'text-[#8a8f98] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#d0d6e0]'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <button 
              onClick={(e) => hasChildren ? toggleExpand(e, node.id) : undefined}
              className={`p-0.5 rounded-[4px] hover:bg-[rgba(255,255,255,0.1)] transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0'}`}
              style={{ pointerEvents: hasChildren ? 'auto' : 'none' }}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {depth === 0 ? <Folder size={14} className={isSelected ? 'text-[#f7f8f8]' : 'text-[#62666d]'} /> : <Hash size={14} className={isSelected ? 'text-[#f7f8f8]' : 'text-[#62666d]'} />}
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
    <div className="w-[240px] h-full flex-shrink-0 bg-[#0f1011] border-r border-[rgba(255,255,255,0.05)] flex flex-col z-20">
      <div className="h-14 flex items-center px-4 border-b border-[rgba(255,255,255,0.05)] shrink-0 space-x-2">
        <LoaderPinwheel className="text-[#f7f8f8]" size={18} />
        <span className="text-[16px] font-[510] text-[#f7f8f8] tracking-[-0.165px]">Arvid</span>
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar py-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-[11px] font-[510] text-[#62666d] uppercase tracking-widest">Projects</span>
          <IconButton onClick={() => openCreate()} title="New Project">
            <Plus size={14} />
          </IconButton>
        </div>
        
        {projectsDataState.status === 'loading' && projects.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="text-[#62666d] animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Folder size={24} className="mx-auto mb-2 text-[#3a3d42] opacity-60" />
            <p className="text-[12px] text-[#4a4e54] mb-3">No projects yet.</p>
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.08)] rounded-[6px] text-[12px] font-[510] text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
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

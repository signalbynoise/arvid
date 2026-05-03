import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, Hash, MoreHorizontal, LoaderPinwheel } from 'lucide-react';
import { IconButton } from './IconButton';
import { Project } from '../types';
import { useStore, selectProjects, selectSelectedProjectId } from '../store';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const projects = useStore(selectProjects);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);
  const createProject = useStore(s => s.createProject);

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'p1': true
  });

  if (!isOpen) return null;

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateProject = (parentId?: string) => {
    const name = prompt('Enter project name:');
    if (!name) return;
    createProject(name, parentId);
  };

  const renderProject = (project: Project, depth = 0) => {
    const isExpanded = expandedProjects[project.id];
    const isSelected = selectedProjectId === project.id;
    const hasChildren = project.subProjects && project.subProjects.length > 0;

    return (
      <div key={project.id}>
        <div 
          onClick={() => setSelectedProjectId(project.id)}
          className={`group flex items-center justify-between py-1.5 px-2 mx-2 rounded-[6px] cursor-pointer text-[13px] font-[510] transition-colors ${
            isSelected 
              ? 'bg-[rgba(255,255,255,0.08)] text-[#f7f8f8]' 
              : 'text-[#8a8f98] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#d0d6e0]'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <button 
              onClick={(e) => hasChildren ? toggleExpand(e, project.id) : undefined}
              className={`p-0.5 rounded-[4px] hover:bg-[rgba(255,255,255,0.1)] transition-colors ${hasChildren ? 'opacity-100' : 'opacity-0'}`}
              style={{ pointerEvents: hasChildren ? 'auto' : 'none' }}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {depth === 0 ? <Folder size={14} className={isSelected ? 'text-[#f7f8f8]' : 'text-[#62666d]'} /> : <Hash size={14} className={isSelected ? 'text-[#f7f8f8]' : 'text-[#62666d]'} />}
            <span className="truncate">{project.name}</span>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              onClick={(e) => { e.stopPropagation(); handleCreateProject(project.id); }}
              title="Add sub-project"
            >
              <Plus size={14} />
            </IconButton>
            <IconButton onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal size={14} />
            </IconButton>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {project.subProjects!.map(sub => renderProject(sub, depth + 1))}
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
          <IconButton onClick={() => handleCreateProject()} title="New Project">
            <Plus size={14} />
          </IconButton>
        </div>
        
        <div className="space-y-0.5">
          {projects.map(p => renderProject(p))}
        </div>
      </div>
    </div>
  );
}

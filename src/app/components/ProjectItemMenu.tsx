import React from 'react';
import { Pencil, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { IconButton } from './IconButton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

interface Props {
  onAddSubProject: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function ProjectItemMenu({ onAddSubProject, onRename, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <IconButton onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={14} />
          </IconButton>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        className="bg-[#1a1c1e] border-[rgba(255,255,255,0.1)] min-w-[160px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          onClick={onAddSubProject}
          className="flex items-center gap-2 text-[12px] text-[#d0d6e0] hover:text-[#f7f8f8] cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Sub-project</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onRename}
          className="flex items-center gap-2 text-[12px] text-[#d0d6e0] hover:text-[#f7f8f8] cursor-pointer"
        >
          <Pencil size={14} />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          variant="destructive"
          className="flex items-center gap-2 text-[12px] cursor-pointer"
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

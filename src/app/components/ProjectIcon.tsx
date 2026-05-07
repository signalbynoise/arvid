import React from 'react';
import { Folder, FolderInput } from 'lucide-react';

interface ProjectIconProps {
  depth: number;
  isSelected: boolean;
}

export function ProjectIcon({ depth, isSelected }: ProjectIconProps) {
  const colorClass = isSelected ? 'text-text-primary' : 'text-text-quaternary';
  return depth === 0
    ? <Folder size={16} className={`${colorClass} shrink-0`} />
    : <FolderInput size={16} className={`${colorClass} shrink-0`} />;
}

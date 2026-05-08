import React from 'react';
import { Folder } from 'lucide-react';

interface ProjectIconProps {
  depth: number;
  isSelected: boolean;
}

export function ProjectIcon({ depth: _depth, isSelected }: ProjectIconProps) {
  const colorClass = isSelected ? 'text-text-primary' : 'text-text-quaternary';
  return <Folder size={14} className={`${colorClass} shrink-0`} />;
}

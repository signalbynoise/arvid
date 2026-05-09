import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Folder, FolderOpen } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';

interface ProjectIconProps {
  depth: number;
  isSelected: boolean;
  isOpen?: boolean;
}

export function ProjectIcon({ depth: _depth, isSelected, isOpen = false }: ProjectIconProps) {
  const colorClass = isSelected ? 'text-text-primary' : 'text-text-quaternary';
  const Icon = isOpen ? FolderOpen : Folder;

  return (
    <span className={`relative inline-flex items-center justify-center w-[14px] h-[14px] shrink-0 ${colorClass}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isOpen ? 'open' : 'closed'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 inline-flex items-center justify-center"
        >
          <Icon size={ICON_SIZE.sm} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

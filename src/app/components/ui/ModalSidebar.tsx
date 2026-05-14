import React from 'react';

export interface ModalSidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ModalSidebarProps {
  items: ModalSidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function ModalSidebar({ items, activeId, onSelect }: ModalSidebarProps) {
  return (
    <nav className="w-[200px] shrink-0 border-r border-border-strong p-6 flex flex-col gap-1">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-comfortable text-caption-lg transition-colors text-left ${
            activeId === item.id
              ? 'bg-surface-frost-08 text-text-primary'
              : 'text-text-tertiary hover:bg-surface-frost-04 hover:text-text-secondary'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

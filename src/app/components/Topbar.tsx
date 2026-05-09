import React from 'react';
import { PanelLeft } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { IconButton } from './IconButton';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ isSidebarOpen, onToggleSidebar }: TopbarProps) {
  return (
    <div className="border-b border-border-subtle flex items-center px-4 py-3 bg-surface-panel shrink-0 relative z-30">
      <div className="flex items-center gap-2 min-w-0">
        <IconButton
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelLeft size={ICON_SIZE.sm} />
        </IconButton>
        <Breadcrumbs />
      </div>
      <div className="ml-auto flex items-center shrink-0">
        <UserMenu />
      </div>
    </div>
  );
}

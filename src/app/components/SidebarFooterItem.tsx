import React from 'react';

interface SidebarFooterItemProps {
  icon: React.ReactNode;
  label: string;
  isConnected: boolean;
  children: React.ReactNode;
}

export function SidebarFooterItem({ icon, label, isConnected, children }: SidebarFooterItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-label text-text-tertiary">
          {label}
        </span>
        {isConnected && (
          <span className="w-2 h-2 rounded-full bg-status-success shrink-0" />
        )}
      </div>
      {children}
    </div>
  );
}

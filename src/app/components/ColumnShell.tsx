import React from 'react';

interface ColumnShellProps {
  title: string;
  headerControls?: React.ReactNode;
  borderRight?: boolean;
  children: React.ReactNode;
}

const COLUMN_CLASSES = 'w-1/4 min-w-[400px] shrink-0 h-full flex flex-col bg-surface-panel';

export function ColumnShell({ title, headerControls, borderRight = true, children }: ColumnShellProps) {
  return (
    <div className={`${COLUMN_CLASSES}${borderRight ? ' border-r border-border-subtle' : ''}`}>
      <div className="sticky top-0 z-10 bg-surface-panel px-4 h-[46px] border-b border-border-subtle flex items-center justify-between shrink-0">
        <h2 className="text-label-upper text-text-tertiary">{title}</h2>
        {headerControls && (
          <div className="flex items-center">
            {headerControls}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function ColumnBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex-1 min-h-0 overflow-y-auto hide-scrollbar p-4 space-y-4${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

export function ColumnEmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-quaternary">
      {icon}
      <p className="text-[13px]">{message}</p>
    </div>
  );
}

export { COLUMN_CLASSES };

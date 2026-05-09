import React from 'react';
import { MiniColumnHeader } from './MiniColumnHeader';

export const MINI_DEMO_COLUMN_MIN_WIDTH_CLASS = 'min-w-[180px]';

interface MiniColumnProps {
  title: string;
  controls?: React.ReactNode;
  borderRight?: boolean;
  width?: string;
  children: React.ReactNode;
}

export function MiniColumn({ title, controls, borderRight = true, width = 'w-1/4', children }: MiniColumnProps) {
  const shrink = width.startsWith('flex') ? '' : 'shrink-0';
  return (
    <div className={`${width} ${shrink} ${MINI_DEMO_COLUMN_MIN_WIDTH_CLASS} flex flex-col bg-surface-panel${borderRight ? ' border-r border-border-subtle' : ''}`}>
      <MiniColumnHeader title={title} trailing={controls} />
      <div className="flex-1 p-2 space-y-2 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

interface MiniColumnEmptyProps {
  icon: React.ReactNode;
  message: string;
}

export function MiniColumnEmpty({ icon, message }: MiniColumnEmptyProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full">
      {icon}
      <p className="text-[8px] text-text-quaternary">{message}</p>
    </div>
  );
}

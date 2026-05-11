import { Database, ChevronDown } from 'lucide-react';

interface DatabaseMenuProps {
  databaseName: string;
  visible: boolean;
}

export function DatabaseMenu({ databaseName, visible }: DatabaseMenuProps) {
  return (
    <div
      data-cursor-target="dmc-db-menu"
      className={`flex flex-col transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
    >
      <div className="bg-surface-panel border-t border-x border-border-default rounded-t-comfortable py-4">
        <div className="flex flex-col gap-4">
            <div className="flex items-center px-3">
              <span className="text-label text-text-quaternary">DATABASES</span>
            </div>
          <div className="flex items-center gap-2 px-3">
            <Database size={14} className="text-text-tertiary" />
            <span className="text-caption-lg text-text-primary">{databaseName}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-surface-panel border border-border-default rounded-b-comfortable">
        <span className="text-caption font-[var(--fw-medium)] text-text-tertiary">Select database</span>
        <ChevronDown size={16} className="text-text-quaternary" />
      </div>
    </div>
  );
}

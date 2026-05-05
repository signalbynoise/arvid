import { ChevronDown, Plus } from 'lucide-react';
import { PROJECTS } from './data';

interface DemoSidebarProps {
  expanded: boolean;
}

export function DemoSidebar({ expanded }: DemoSidebarProps) {
  return (
    <div className="w-[140px] shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
      <div className="h-8 flex items-center px-3 border-b border-border-subtle shrink-0">
        <img src="/logo_wide.svg" alt="Arvid" className="h-3" />
      </div>

      <div className="flex-1 py-2 overflow-hidden">
        <div className="flex items-center justify-between px-3 mb-1.5">
          <span className="text-[8px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Projects</span>
          <Plus size={8} className="text-text-quaternary" />
        </div>

        {PROJECTS.map(p => (
          <div key={p.id}>
            <div className={`flex items-center space-x-1.5 px-3 py-1 text-[9px] rounded-sm mx-1 transition-colors duration-300 ${
              p.id === 'p1' ? 'bg-surface-frost-08 text-text-primary' : 'text-text-tertiary'
            }`}>
              {p.children.length > 0 && <ChevronDown size={8} className="shrink-0" />}
              <p.icon size={9} className="shrink-0 text-text-quaternary" />
              <span className="truncate font-[var(--fw-medium)]">{p.name}</span>
            </div>
            {expanded && p.children.length > 0 && (
              <div className="ml-3">
                {p.children.map(c => (
                  <div key={c.id} className="flex items-center space-x-1.5 px-3 py-0.5 text-[8px] text-text-tertiary transition-all duration-500">
                    <c.icon size={8} className="shrink-0 text-text-quaternary" />
                    <span className="truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

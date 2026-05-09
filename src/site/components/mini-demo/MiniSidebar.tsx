import React from 'react';
import { ChevronDown, LoaderPinwheel, Network, Folder } from 'lucide-react';
import type { MiniTeam } from './types';

interface MiniSidebarProps {
  workspaceName: string;
  teams: MiniTeam[];
  expandedProjectId?: string;
  footer?: React.ReactNode;
}

export function MiniSidebar({ workspaceName, teams, expandedProjectId, footer }: MiniSidebarProps) {
  return (
    <div className="w-[140px] shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
      <div className="flex items-center px-3 py-2 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          <LoaderPinwheel size={9} className="text-text-primary shrink-0" />
          <span className="text-[8px] font-[var(--fw-medium)] text-text-primary truncate">{workspaceName}</span>
          <ChevronDown size={7} className="shrink-0 text-text-quaternary" />
        </div>
      </div>

      <div className="flex-1 py-2 overflow-hidden">
        {teams.map(team => (
          <div key={team.id} className="mb-2">
            <div className="flex items-center gap-1 px-3 py-0.5 text-[8px] font-[var(--fw-medium)] text-text-tertiary">
              <Network size={8} className="shrink-0 text-text-quaternary" />
              <span className="truncate">{team.name}</span>
            </div>

            {team.projects.map(p => (
              <div key={p.id}>
                <div className={`flex items-center gap-1 px-3 py-0.5 ml-2 text-[8px] rounded-micro transition-colors duration-300 ${
                  p.isActive ? 'text-text-primary' : 'text-text-tertiary'
                }`}>
                  <Folder size={8} className={`shrink-0 ${p.isActive ? 'text-text-primary' : 'text-text-quaternary'}`} />
                  <span className="truncate font-[var(--fw-medium)]">{p.name}</span>
                </div>
                {expandedProjectId === p.id && p.children.length > 0 && (
                  <div className="ml-5">
                    {p.children.map(c => (
                      <div key={c.id} className="flex items-center gap-1 px-3 py-0.5 text-[7px] text-text-tertiary transition-all duration-500">
                        <Folder size={7} className="shrink-0 text-text-quaternary" />
                        <span className="truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
}

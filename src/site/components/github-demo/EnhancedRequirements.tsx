import { User, GitBranch, Plus } from 'lucide-react';

interface EnhancedRequirementsProps {
  showReq1: boolean;
  showReq2: boolean;
  selectReq: boolean;
  showContextBadge: boolean;
}

export function EnhancedRequirements({ showReq1, showReq2, selectReq, showContextBadge }: EnhancedRequirementsProps) {
  return (
    <div className="w-1/2 shrink-0 flex flex-col border-r border-border-subtle bg-surface-panel">
      <div className="p-2 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">1. Requirements</span>
        <Plus size={8} className="text-text-quaternary" />
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-hidden">
        <div className={`p-2.5 rounded-md border border-border-subtle transition-all duration-500 ${
          showReq1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        } ${selectReq ? 'bg-surface-frost-05' : 'bg-surface-frost-02'}`}>
          {showContextBadge && (
            <div className="flex items-center gap-1 mb-1.5 transition-all duration-400 opacity-100">
              <GitBranch size={7} className="text-green-500" />
              <span className="text-[6px] font-[var(--fw-medium)] text-green-500/70">Enhanced with repo context</span>
            </div>
          )}
          <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight mb-1.5">
            Post-Login OAuth Profile Refresh
          </h4>
          <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
            <User size={8} className="opacity-70" />
            <span>Erik L.</span>
          </div>
          <div className="flex items-center justify-between text-[7px]">
            <div className="flex items-center space-x-1.5">
              <div className="w-8 h-1 bg-surface-frost-10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-status-warning" style={{ width: '55%' }} />
              </div>
              <span className="text-text-secondary font-[var(--fw-medium)]">55%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-status-warning" />
              <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
            </div>
          </div>
        </div>

        <div className={`p-2.5 rounded-md border border-border-subtle bg-surface-frost-02 transition-all duration-500 ${
          showReq2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        } ${selectReq ? 'opacity-30' : ''}`}>
          <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight mb-1.5">
            GitHub OAuth &amp; Repository Analysis
          </h4>
          <div className="flex items-center text-[8px] text-text-tertiary mb-2 space-x-1">
            <User size={8} className="opacity-70" />
            <span>Erik L.</span>
          </div>
          <div className="flex items-center justify-between text-[7px]">
            <div className="flex items-center space-x-1.5">
              <div className="w-8 h-1 bg-surface-frost-10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-status-success" style={{ width: '100%' }} />
              </div>
              <span className="text-text-secondary font-[var(--fw-medium)]">100%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <div className="w-1.5 h-1.5 rounded-full bg-status-success" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

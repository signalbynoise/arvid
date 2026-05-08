import { Loader2, ChevronRight, BarChart3 } from 'lucide-react';
import type { Summary } from './types';

interface DemoSummaryProps {
  summary: Summary;
  completeness: number;
  sendEnabled: boolean;
  generating: boolean;
}

export function DemoSummary({ summary, completeness, sendEnabled, generating }: DemoSummaryProps) {
  const barColor = completeness >= 80 ? 'bg-status-success' : completeness >= 30 ? 'bg-status-warning' : 'bg-status-error';

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1.5 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-wide">Summary</span>
        <BarChart3 size={8} className="text-text-quaternary" />
      </div>

      <div className="flex-1 p-2 overflow-hidden">
        <div className="bg-surface-elevated border border-border-default rounded-[3px] overflow-hidden">
          <div className="p-2 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[6px] font-mono text-text-quaternary">{summary.shortId}</span>
            </div>
            <h4 className="text-[8px] font-[var(--fw-medium)] text-text-primary leading-tight">{summary.title}</h4>
          </div>

          <div className="px-2 pb-2">
            {generating ? (
              <div className="flex flex-col items-center py-4 space-y-2">
                <Loader2 size={12} className="text-text-tertiary animate-spin" />
                <p className="text-[7px] text-text-tertiary">Arvid is analyzing...</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Knowledge Completeness — collapsible section */}
                <details className="border-b border-border-subtle" open>
                  <summary className="flex items-center justify-between cursor-pointer py-1.5 text-[7px] font-[var(--fw-medium)] text-text-tertiary outline-none list-none [&::-webkit-details-marker]:hidden">
                    <span>Knowledge Completeness</span>
                    <ChevronRight size={7} className="text-text-quaternary transition-transform [details[open]>&]:rotate-90" />
                  </summary>
                  <div className="pb-2 pt-0.5">
                    <div className="w-full h-1 bg-surface-frost-10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${barColor}`} style={{ width: `${completeness}%` }} />
                    </div>
                  </div>
                </details>

                {/* Core Objective — collapsible section */}
                <details className="border-b border-border-subtle" open>
                  <summary className="flex items-center justify-between cursor-pointer py-1.5 text-[7px] font-[var(--fw-medium)] text-text-tertiary outline-none list-none [&::-webkit-details-marker]:hidden">
                    <span>Core Objective</span>
                    <ChevronRight size={7} className="text-text-quaternary transition-transform [details[open]>&]:rotate-90" />
                  </summary>
                  <div className="pb-2 pt-0.5">
                    <p className="text-[7px] text-text-primary leading-relaxed">{summary.objective}</p>
                  </div>
                </details>

                {/* Architecture — collapsible section */}
                <details className="last:border-0">
                  <summary className="flex items-center justify-between cursor-pointer py-1.5 text-[7px] font-[var(--fw-medium)] text-text-tertiary outline-none list-none [&::-webkit-details-marker]:hidden">
                    <span>Architecture</span>
                    <ChevronRight size={7} className="text-text-quaternary transition-transform [details[open]>&]:rotate-90" />
                  </summary>
                  <div className="pb-2 pt-0.5">
                    <div className="flex flex-wrap gap-1">
                      {summary.tags.map(tag => (
                        <span key={tag} className="text-[6px] px-1 py-0.5 bg-surface-frost-05 border border-border-subtle rounded-[2px] text-text-quaternary">{tag}</span>
                      ))}
                    </div>
                  </div>
                </details>

                <div className="flex gap-1 pt-2">
                  <button className="flex-1 py-1 px-1.5 border border-border-default bg-surface-elevated rounded-[1px] text-[7px] font-[var(--fw-medium)] text-text-tertiary opacity-50 flex items-center justify-center gap-1">
                    <img src="/linear.svg" alt="" className="w-2.5 h-2.5 opacity-60" />
                    <span>Linear</span>
                  </button>
                  <button className={`flex-1 py-1 px-1.5 border border-border-default rounded-[1px] text-[7px] font-[var(--fw-medium)] flex items-center justify-center gap-1 transition-all duration-700 ${
                    sendEnabled ? 'bg-surface-frost-08 text-text-primary' : 'bg-surface-elevated text-text-tertiary opacity-50'
                  }`}>
                    <img src="/cursor.svg" alt="" className="w-2.5 h-2.5 opacity-60" />
                    <span>Cursor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

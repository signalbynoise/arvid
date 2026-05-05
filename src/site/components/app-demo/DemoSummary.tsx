import { Loader2, Sparkles, FileText, ArrowUpRight, LoaderPinwheel } from 'lucide-react';
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
      <div className="p-2 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[8px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">4. Summary</span>
      </div>

      <div className="flex-1 p-2 overflow-hidden">
        <div className="bg-surface-frost-02 border border-border-subtle rounded-md overflow-hidden">
          <div className="p-2 border-b border-border-subtle">
            <h4 className="text-[9px] font-[var(--fw-medium)] text-text-primary leading-tight">{summary.title}</h4>
            <div className="flex items-center space-x-1 mt-1">
              <LoaderPinwheel size={7} className="text-text-tertiary" />
              <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Arvid Specification</span>
            </div>
          </div>

          <div className="p-2 space-y-2">
            {generating ? (
              <div className="flex flex-col items-center py-4 space-y-2">
                <Loader2 size={12} className="text-text-tertiary animate-spin" />
                <p className="text-[7px] text-text-tertiary">Arvid is analyzing...</p>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[7px] text-text-tertiary font-[var(--fw-medium)]">Knowledge Completeness</span>
                    <span className={`text-[8px] font-[var(--fw-medium)] ${completeness >= 80 ? 'text-status-success' : 'text-status-warning'}`}>{completeness}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-frost-10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${barColor}`} style={{ width: `${completeness}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Sparkles size={7} className="text-text-quaternary" />
                    <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">Core Objective</span>
                  </div>
                  <p className="text-[7px] text-text-quaternary leading-relaxed">{summary.objective}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <FileText size={7} className="text-text-quaternary" />
                    <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">Architecture</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {summary.tags.map(tag => (
                      <span key={tag} className="text-[6px] px-1 py-0.5 bg-surface-frost-05 border border-border-subtle rounded text-text-quaternary">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-1.5 pt-1">
                  <button className="flex-1 py-1 px-2 border border-border-subtle bg-surface-frost-02 rounded text-[7px] font-[var(--fw-medium)] text-text-tertiary opacity-50 flex items-center justify-center space-x-1">
                    <span>Send to Linear</span>
                    <ArrowUpRight size={6} />
                  </button>
                  <button className={`flex-1 py-1 px-2 border border-border-subtle rounded text-[7px] font-[var(--fw-medium)] flex items-center justify-center space-x-1 transition-all duration-700 ${
                    sendEnabled ? 'bg-surface-frost-08 text-text-primary' : 'bg-surface-frost-02 text-text-tertiary opacity-50'
                  }`}>
                    <span>Send to Cursor</span>
                    <ArrowUpRight size={6} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

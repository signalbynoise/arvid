import React, { useState, useEffect, useMemo } from 'react';
import { FileText, AlertTriangle, ShieldAlert, CheckCircle2, Sparkles, Network, ArrowUpRight, LoaderPinwheel, Loader2, Target, Settings, Shield } from 'lucide-react';
import { useStore, selectRequirements, selectQuestions, selectSelectedReqId } from '../store';

const mockSummaryContent: Record<string, { synthesis: string; coreObjective: string; architecture: string; constraints: string; unverifiedRisks: string }> = {
  r1: {
    synthesis: 'Automated SOC2 compliance framework utilizing event-driven architecture to enforce access reviews. Triggers escalate on SLA breaches to prevent audit failures.',
    coreObjective: 'Ensure continuous compliance by automating quarterly (standard) and monthly (privileged) access reviews for Production environments.',
    architecture: 'Trigger-based cron jobs integrating with IAM directory APIs. State management handled via temporal workflows.',
    constraints: 'Must strictly apply to Production environments initially. Auto-revocation logic requires aggressive failsafes.',
    unverifiedRisks: 'Handling of API access tokens remains undefined. Contractor review cadences are currently in dispute.'
  },
  r2: {
    synthesis: 'High-throughput edge ingestion pipeline optimized for low-latency telemetry collection with downstream idempotency handling.',
    coreObjective: 'Reliably capture, queue, and stream vast amounts of platform telemetry to analytics clusters without dropping events under load.',
    architecture: 'At-least-once delivery semantics relying on scalable message brokers (e.g., Kafka/Redpanda).',
    constraints: 'Targeting up to 150k events/sec peak load. Edge serialization format requires strict schema registries.',
    unverifiedRisks: 'Latency SLAs from emission-to-query are undefined. Hot-to-cold storage lifecycle remains unspecified.'
  },
  r3: {
    synthesis: 'Strict, database-enforced multi-tenant financial isolation using PostgreSQL Row-Level Security (RLS) and system-defined roles.',
    coreObjective: 'Guarantee secure financial data segmentation across enterprise departments while allowing authorized cross-entity aggregation.',
    architecture: 'PostgreSQL RLS policies mapping to JWT claims. Aggregation views dynamically scoped by API contexts.',
    constraints: 'Strictly system-defined roles for v1 launch. Custom roles explicitly out of scope.',
    unverifiedRisks: 'None identified. Scope is highly constrained and security patterns are established.'
  },
  r4: {
    synthesis: 'AI-driven operational enhancement leveraging Azure OpenAI (GPT-4o-mini) to categorize, tag, and route inbound support traffic.',
    coreObjective: 'Reduce first-response times and human triage workload by automatically parsing intent from inbound customer tickets.',
    architecture: 'Event listener on ticketing webhook -> PII scrubbing middleware (pending resolution) -> Azure OpenAI -> Ticket update API.',
    constraints: 'Low-confidence inferences must silently route to human queues to avoid negative UX.',
    unverifiedRisks: 'Critical EU compliance conflict regarding PII transmission. Decision on auto-reply vs passive routing is blocking execution.'
  },
  r5: {
    synthesis: 'Geographically isolated data infrastructure enabling strict physical boundaries for customer payloads in compliance with local regulations.',
    coreObjective: 'Deploy isolated environments in EU, US (and potentially Canada) to meet enterprise data sovereignty mandates.',
    architecture: 'Regional database shards with global edge routing for initial request termination. Asynchronous cross-region replication disabled.',
    constraints: 'Mandatory active-active deployments in specified regions. Complex migration paths required for existing tenants.',
    unverifiedRisks: 'Treatment of global user metadata is undefined. Expansion into Canada is disputed. Cross-region migration strategy unknown.'
  }
};

export function SummaryColumn() {
  const requirements = useStore(selectRequirements);
  const allQuestions = useStore(selectQuestions);
  const selectedReqId = useStore(selectSelectedReqId);

  const requirement = useMemo(
    () => requirements.find(r => r.id === selectedReqId) ?? null,
    [requirements, selectedReqId],
  );
  const questions = useMemo(
    () => allQuestions.filter(q => q.requirementId === selectedReqId),
    [allQuestions, selectedReqId],
  );

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (requirement || questions.length > 0) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [requirement, questions]);

  if (!requirement) {
    return (
      <div className="w-1/4 h-full flex flex-col">
        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#0f1011] sticky top-0 z-10">
          <h2 className="font-[510] text-[#8a8f98] text-[11px] tracking-widest uppercase">4. Summary</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#62666d]">
          <FileText size={32} className="mb-3 opacity-20" />
          <p className="text-[13px]">Select a requirement to view its live summary.</p>
        </div>
      </div>
    );
  }

  const missingCritical = questions.filter(q => q.status === 'Unanswered' && q.importance === 'Critical');
  const conflicts = questions.filter(q => q.status === 'Conflicting');

  const totalWeight = questions.reduce((acc, q) => acc + (q.importance === 'Critical' ? 3 : q.importance === 'Important' ? 2 : 1), 0);
  const answeredWeight = questions.filter(q => q.status === 'Answered').reduce((acc, q) => acc + (q.importance === 'Critical' ? 3 : q.importance === 'Important' ? 2 : 1), 0);
  const calculatedCompleteness = totalWeight > 0 ? Math.round((answeredWeight / totalWeight) * 100) : 0;

  const content = mockSummaryContent[requirement.id] || mockSummaryContent.r1;

  const requestAuthor = requirement.owner || 'System';
  const qAuthors = Array.from(new Set(questions.map(q => q.author).filter(Boolean))) as string[];
  const ansAuthors = ['Jane (Engineering)', 'Mike (Security)'];

  return (
    <div className="w-1/4 h-full flex flex-col bg-[#0f1011]">
      <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#0f1011] sticky top-0 z-10 flex items-center justify-between">
        <h2 className="font-[510] text-[#8a8f98] text-[11px] tracking-widest uppercase flex items-center space-x-2">
          <span>4. Summary</span>
        </h2>
        {isUpdating && (
          <Loader2 size={12} className="text-[#8a8f98] animate-spin" />
        )}
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-5">
        
        
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[12px] shadow-[rgba(0,0,0,0.2)_0px_0px_0px_1px] overflow-hidden mb-6">
          <div className="bg-[rgba(255,255,255,0.02)] p-4 border-b border-[rgba(255,255,255,0.05)] flex items-start justify-between">
            <div>
              <h3 className="font-[510] text-[#f7f8f8] text-[16px] leading-tight tracking-[-0.165px]">{requirement.title}</h3>
              <div className="flex items-center space-x-2 mt-2">
                <LoaderPinwheel size={12} className="text-[#8a8f98]" />
                <span className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Arvid Specification</span>
              </div>
            </div>
          </div>
          
          <div className="p-2 space-y-1">
            <details className="group border-b border-[rgba(255,255,255,0.05)] last:border-0" open>
              <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center space-x-2">
                  <h4 className="text-[11px] font-[510] text-[#d0d6e0] uppercase tracking-widest flex items-center space-x-1.5">
                    <Target size={12} className="text-[#8a8f98]" />
                    <span>Knowledge Completeness</span>
                  </h4>
                </div>
                <svg className="w-3.5 h-3.5 text-[#62666d] transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="p-2 pt-1 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          calculatedCompleteness >= 80 ? 'bg-[#10b981]' : calculatedCompleteness >= 50 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                        }`} 
                        style={{ width: `${calculatedCompleteness}%` }} 
                      />
                    </div>
                    <span className="font-[510] text-[#f7f8f8] text-[13px] w-8 text-right">{calculatedCompleteness}%</span>
                  </div>
                </div>
              </div>
            </details>

            <details className="group border-b border-[rgba(255,255,255,0.05)] last:border-0" open>
              <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
                <h4 className="text-[11px] font-[510] text-[#d0d6e0] uppercase tracking-widest flex items-center space-x-1.5">
                  <Network size={12} className="text-[#8a8f98]" />
                  <span>Task Overview</span>
                </h4>
                <svg className="w-3.5 h-3.5 text-[#62666d] transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="p-2 pt-1 pb-4 space-y-4">
                <div>
                  <h5 className="text-[10px] font-[510] text-[#62666d] uppercase tracking-widest mb-1.5">Context</h5>
                  <p className="text-[13px] text-[#f7f8f8] leading-relaxed">{content.synthesis}</p>
                </div>
                <div>
                  <h5 className="text-[10px] font-[510] text-[#62666d] uppercase tracking-widest mb-1.5">What to Build</h5>
                  <p className="text-[13px] text-[#d0d6e0] leading-relaxed">{content.coreObjective}</p>
                </div>
              </div>
            </details>

            <details className="group border-b border-[rgba(255,255,255,0.05)] last:border-0" open>
              <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
                <h4 className="text-[11px] font-[510] text-[#d0d6e0] uppercase tracking-widest flex items-center space-x-1.5">
                  <Settings size={12} className="text-[#8a8f98]" />
                  <span>Implementation Details</span>
                </h4>
                <svg className="w-3.5 h-3.5 text-[#62666d] transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="p-2 pt-1 pb-4">
                <p className="text-[13px] text-[#d0d6e0] leading-relaxed">{content.architecture}</p>
              </div>
            </details>

            <details className="group border-b border-[rgba(255,255,255,0.05)] last:border-0">
              <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
                <h4 className="text-[11px] font-[510] text-[#d0d6e0] uppercase tracking-widest flex items-center space-x-1.5">
                  <Shield size={12} className="text-[#8a8f98]" />
                  <span>Rules & Constraints</span>
                </h4>
                <svg className="w-3.5 h-3.5 text-[#62666d] transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="p-2 pt-1 pb-4">
                <p className="text-[13px] text-[#d0d6e0] leading-relaxed">{content.constraints}</p>
              </div>
            </details>

            <details className="group border-b border-[rgba(255,255,255,0.05)] last:border-0" open>
              <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
                <h4 className="text-[11px] font-[510] text-[#d0d6e0] uppercase tracking-widest flex items-center space-x-1.5">
                  <Sparkles size={12} className="text-[#8a8f98]" />
                  <span>Knowledge Graph & Authors</span>
                </h4>
                <svg className="w-3.5 h-3.5 text-[#62666d] transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="p-2 pt-1 pb-4 space-y-4">
                <div>
                  <h5 className="text-[10px] font-[510] text-[#62666d] uppercase tracking-widest mb-3">Context Chain</h5>
                  <div className="relative pl-4 border-l border-[rgba(255,255,255,0.1)] space-y-4 ml-2">
                    
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.2)] border-2 border-[#0f1011]"></div>
                      <div className="flex items-center space-x-2 mb-0.5">
                        <div className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[8px] font-[510] text-[#d0d6e0]">{requestAuthor.charAt(0).toUpperCase()}</div>
                        <span className="text-[12px] font-[510] text-[#f7f8f8]">Request Author</span>
                      </div>
                      <p className="text-[11px] text-[#8a8f98] leading-relaxed">{requestAuthor} • Defined initial spec</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.2)] border-2 border-[#0f1011]"></div>
                      <div className="flex items-center space-x-2 mb-0.5">
                        <div className="flex -space-x-1">
                          {qAuthors.length > 0 ? qAuthors.slice(0, 3).map((a, i) => (
                            <div key={i} className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[8px] font-[510] text-[#d0d6e0] z-10">{a.charAt(0).toUpperCase()}</div>
                          )) : (
                            <div className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[8px] font-[510] text-[#d0d6e0] z-10">A</div>
                          )}
                        </div>
                        <span className="text-[12px] font-[510] text-[#f7f8f8]">Question Authors</span>
                      </div>
                      <p className="text-[11px] text-[#8a8f98] leading-relaxed">{qAuthors.length > 0 ? qAuthors.join(', ') : 'Arvid (AI)'} • Raised {questions.length} questions</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.2)] border-2 border-[#0f1011]"></div>
                      <div className="flex items-center space-x-2 mb-0.5">
                        <div className="flex -space-x-1">
                          {ansAuthors.map((a, i) => (
                            <div key={i} className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[8px] font-[510] text-[#d0d6e0] z-10">{a.charAt(0).toUpperCase()}</div>
                          ))}
                        </div>
                        <span className="text-[12px] font-[510] text-[#f7f8f8]">Answer Authors</span>
                      </div>
                      <p className="text-[11px] text-[#8a8f98] leading-relaxed">{ansAuthors.join(', ')} • Provided resolutions</p>
                    </div>

                  </div>
                </div>
              </div>
            </details>

            <details className="group border-b border-[rgba(255,255,255,0.05)] last:border-0" open={(missingCritical.length > 0 || conflicts.length > 0)}>
              <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-[rgba(255,255,255,0.02)] rounded-[6px] transition-colors outline-none list-none [&::-webkit-details-marker]:hidden">
                <h4 className="text-[11px] font-[510] text-[#f59e0b] uppercase tracking-widest flex items-center space-x-1.5">
                  {(missingCritical.length > 0 || conflicts.length > 0) && <AlertTriangle size={12} />}
                  <span>Open Questions & Blockers</span>
                </h4>
                <svg className="w-3.5 h-3.5 text-[#62666d] transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="p-2 pt-1 pb-4 space-y-4">
                <p className="text-[13px] text-[#f59e0b] leading-relaxed">{content.unverifiedRisks}</p>
                
                {missingCritical.length > 0 && (
                  <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] p-4 rounded-[8px]">
                    <div className="flex items-center space-x-2 text-[#ef4444] font-[510] mb-3 text-[13px]">
                      <ShieldAlert size={14} />
                      <span>Missing Critical Answers</span>
                    </div>
                    <ul className="space-y-2">
                      {missingCritical.map(q => (
                        <li key={q.id} className="text-[13px] text-[#f7f8f8] bg-[rgba(255,255,255,0.03)] border border-[rgba(239,68,68,0.15)] rounded-[6px] p-2.5 leading-snug">
                          {q.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {conflicts.length > 0 && (
                  <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] p-4 rounded-[8px]">
                    <div className="flex items-center space-x-2 text-[#f59e0b] font-[510] mb-3 text-[13px]">
                      <AlertTriangle size={14} />
                      <span>Active Conflicts</span>
                    </div>
                    <ul className="space-y-2">
                      {conflicts.map(q => (
                        <li key={q.id} className="text-[13px] text-[#f7f8f8] bg-[rgba(255,255,255,0.03)] border border-[rgba(245,158,11,0.15)] rounded-[6px] p-2.5 leading-snug">
                          {q.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>

            <div className="pt-4 pb-2 px-2 mt-2 flex space-x-3">
              <button 
                disabled={calculatedCompleteness < 100}
                className={`flex-1 py-2 px-4 border rounded-[6px] text-[13px] font-[510] transition-all duration-200 flex items-center justify-center space-x-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
                  calculatedCompleteness === 100 
                    ? 'border-[rgba(255,255,255,0.08)] bg-[#141516] hover:bg-[#1a1b1e] hover:border-[rgba(255,255,255,0.12)] text-[#f7f8f8]' 
                    : 'border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] opacity-50 cursor-not-allowed text-[#8a8f98]'
                }`}
              >
                <span>Send to Linear</span>
                <ArrowUpRight size={14} className="opacity-50" />
              </button>
              <button 
                disabled={calculatedCompleteness < 100}
                className={`flex-1 py-2 px-4 border rounded-[6px] text-[13px] font-[510] transition-all duration-200 flex items-center justify-center space-x-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
                  calculatedCompleteness === 100 
                    ? 'border-[rgba(255,255,255,0.08)] bg-[#141516] hover:bg-[#1a1b1e] hover:border-[rgba(255,255,255,0.12)] text-[#f7f8f8]' 
                    : 'border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] opacity-50 cursor-not-allowed text-[#8a8f98]'
                }`}
              >
                <span>Send to Cursor</span>
                <ArrowUpRight size={14} className="opacity-50" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

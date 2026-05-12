import React from 'react';
import { BaseModal } from './BaseModal';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { LoaderPinwheel } from '@/components/animate-ui/icons/loader-pinwheel';
import { ACCORDANCE_WEIGHTS } from '../../../shared/schemas';
import type { Requirement } from '../types';
import type { ImplAnalysis } from '../../../shared/schemas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  requirement: Requirement | null;
  isChecking?: boolean;
  onRecheck?: (id: string) => void;
}

function scoreBarColor(value: number): string {
  if (value >= 80) return 'bg-status-success';
  if (value >= 50) return 'bg-status-warning';
  return 'bg-status-error';
}

const DIMENSION_LABELS: { key: keyof typeof ACCORDANCE_WEIGHTS; field: keyof ImplAnalysis; label: string }[] = [
  { key: 'objective', field: 'objective_met', label: 'Core Objectives' },
  { key: 'architecture', field: 'architecture_met', label: 'Architecture' },
  { key: 'constraints', field: 'constraints_met', label: 'Constraints' },
  { key: 'risks', field: 'risks_addressed', label: 'Risk Mitigation' },
];

export function ImplDetailsModal({ isOpen, onClose, requirement, isChecking, onRecheck }: Props) {
  if (!requirement) return null;

  const confidence = requirement.implConfidence ?? 0;
  const evidence = requirement.implEvidence;
  const checkedAt = requirement.implCheckedAt;
  const analysis = requirement.implAnalysis as ImplAnalysis | undefined;

  const evidenceAside = evidence ? (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-caption-lg text-text-primary">Evidence</h3>
        {checkedAt && (
          <span className="text-label text-text-quaternary">
            {new Date(checkedAt).toLocaleString()}
          </span>
        )}
      </div>
      <div className="rounded-card border border-border-subtle bg-surface-frost-02 p-4 max-h-[360px] overflow-y-auto">
        <p className="text-btn font-mono text-text-tertiary leading-relaxed whitespace-pre-wrap">
          {evidence}
        </p>
      </div>
    </div>
  ) : undefined;

  const modalFooter = (
    <>
      <div>
        {onRecheck && (
          <button
            className="btn-ghost flex items-center gap-2"
            disabled={isChecking}
            onClick={() => onRecheck(requirement.id)}
          >
            <AnimateIcon animate={isChecking || false}>
              <LoaderPinwheel size={14} />
            </AnimateIcon>
            {isChecking ? 'Analyzing...' : 'Re-analyze'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary">Share Analysis</button>
      </div>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Implementation"
      size="wide"
      aside={evidenceAside}
      footer={modalFooter}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-caption-lg text-text-primary mb-2">Confidence</h3>
          <div className="h-2 bg-surface-frost-04 rounded-pill overflow-hidden">
            <div
              className={`h-full rounded-pill transition-all ${scoreBarColor(confidence * 100)}`}
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
        </div>

        {analysis && (
          <>
            <div>
              <h3 className="text-caption-lg text-text-primary mb-2">Accordance</h3>
              <div className="h-2 bg-surface-frost-04 rounded-pill overflow-hidden">
                <div
                  className={`h-full rounded-pill transition-all ${scoreBarColor(analysis.accordance_score)}`}
                  style={{ width: `${analysis.accordance_score}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {DIMENSION_LABELS.map(({ key, field, label }) => {
                const met = analysis[field] as boolean;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className={`text-caption-lg ${met ? 'text-text-primary' : 'text-text-quaternary'}`}>{label}</span>
                    <span className="text-caption-lg font-mono text-text-quaternary">
                      {met ? ACCORDANCE_WEIGHTS[key] : 0}.00%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}

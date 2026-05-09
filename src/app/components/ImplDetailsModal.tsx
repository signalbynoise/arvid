import React from 'react';
import { FileCode, BarChart3, Clock, CheckCircle2, XCircle, Target } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { ACCORDANCE_WEIGHTS } from '../../../shared/schemas';
import type { Requirement } from '../types';
import type { ImplAnalysis } from '../../../shared/schemas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  requirement: Requirement | null;
}

const STATUS_COLOR: Record<string, string> = {
  'Implemented': 'text-status-success',
  'Partially Implemented': 'text-status-warning',
  'Not Implemented': 'text-status-error',
};

const STATUS_BG: Record<string, string> = {
  'Implemented': 'bg-status-success-surface border-status-success-border',
  'Partially Implemented': 'bg-status-warning-surface border-status-warning-border',
  'Not Implemented': 'bg-status-error-surface border-status-error-border',
};

function confidenceLabel(value: number): string {
  if (value >= 0.9) return 'Very High';
  if (value >= 0.7) return 'High';
  if (value >= 0.5) return 'Medium';
  if (value >= 0.3) return 'Low';
  return 'Very Low';
}

function scoreBarColor(value: number): string {
  if (value >= 80) return 'bg-status-success';
  if (value >= 50) return 'bg-status-warning';
  return 'bg-status-error';
}

const DIMENSION_LABELS: { key: keyof typeof ACCORDANCE_WEIGHTS; field: keyof ImplAnalysis; label: string }[] = [
  { key: 'objective', field: 'objective_met', label: 'Core Objective' },
  { key: 'architecture', field: 'architecture_met', label: 'Architecture' },
  { key: 'constraints', field: 'constraints_met', label: 'Constraints' },
  { key: 'risks', field: 'risks_addressed', label: 'Risk Mitigation' },
];

export function ImplDetailsModal({ isOpen, onClose, requirement }: Props) {
  if (!requirement) return null;

  const status = requirement.implStatus ?? 'Unknown';
  const confidence = requirement.implConfidence ?? 0;
  const evidence = requirement.implEvidence;
  const checkedAt = requirement.implCheckedAt;
  const analysis = requirement.implAnalysis as ImplAnalysis | undefined;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Implementation Analysis" size="lg">
      <div className="space-y-5">
        <div className={`flex items-center gap-3 p-3 rounded-card border ${STATUS_BG[status] ?? 'bg-surface-frost-02 border-border-default'}`}>
          <img src="/github.svg" alt="" className="w-5 h-5" />
          <div>
            <p className={`text-caption-lg ${STATUS_COLOR[status] ?? 'text-text-primary'}`}>
              {status}
            </p>
            <p className="text-label text-text-tertiary mt-0.5">
              {requirement.title}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={ICON_SIZE.sm} className="text-text-tertiary" />
            <h3 className="text-label text-text-tertiary">Confidence</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-surface-frost-04 rounded-pill overflow-hidden">
              <div
                className={`h-full rounded-pill transition-all ${scoreBarColor(confidence * 100)}`}
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            <span className="text-caption text-text-secondary shrink-0">
              {Math.round(confidence * 100)}% — {confidenceLabel(confidence)}
            </span>
          </div>
        </div>

        {analysis && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target size={ICON_SIZE.sm} className="text-text-tertiary" />
              <h3 className="text-label text-text-tertiary">Accordance Score</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-surface-frost-04 rounded-pill overflow-hidden">
                <div
                  className={`h-full rounded-pill transition-all ${scoreBarColor(analysis.accordance_score)}`}
                  style={{ width: `${analysis.accordance_score}%` }}
                />
              </div>
              <span className="text-caption text-text-secondary shrink-0">
                {analysis.accordance_score}%
              </span>
            </div>
            <div className="space-y-1.5">
              {DIMENSION_LABELS.map(({ key, field, label }) => {
                const met = analysis[field] as boolean;
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      {met ? (
                        <CheckCircle2 size={ICON_SIZE.sm} className="text-status-success" />
                      ) : (
                        <XCircle size={ICON_SIZE.sm} className="text-status-error" />
                      )}
                      <span className="text-caption text-text-secondary">{label}</span>
                    </div>
                    <span className="text-label text-text-quaternary">{ACCORDANCE_WEIGHTS[key]}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {evidence && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCode size={ICON_SIZE.sm} className="text-text-tertiary" />
              <h3 className="text-label text-text-tertiary">Evidence</h3>
            </div>
            <div className="rounded-card border border-border-subtle bg-surface-frost-02 p-3">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {evidence}
              </p>
            </div>
          </div>
        )}

        {checkedAt && (
          <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
            <Clock size={13} className="text-text-quaternary" />
            <span className="text-label text-text-quaternary">
              Analyzed {new Date(checkedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

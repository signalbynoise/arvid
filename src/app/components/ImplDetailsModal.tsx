import React from 'react';
import { GitBranch, FileCode, BarChart3, Clock } from 'lucide-react';
import { BaseModal } from './BaseModal';
import type { Requirement } from '../types';

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

function confidenceBarColor(value: number): string {
  if (value >= 0.8) return 'bg-status-success';
  if (value >= 0.5) return 'bg-status-warning';
  return 'bg-status-error';
}

export function ImplDetailsModal({ isOpen, onClose, requirement }: Props) {
  if (!requirement) return null;

  const status = requirement.implStatus ?? 'Unknown';
  const confidence = requirement.implConfidence ?? 0;
  const evidence = requirement.implEvidence;
  const checkedAt = requirement.implCheckedAt;

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
            <BarChart3 size={14} className="text-text-tertiary" />
            <h3 className="text-section text-text-tertiary">CONFIDENCE</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-surface-frost-04 rounded-pill overflow-hidden">
              <div
                className={`h-full rounded-pill transition-all ${confidenceBarColor(confidence)}`}
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            <span className="text-caption text-text-secondary shrink-0">
              {Math.round(confidence * 100)}% — {confidenceLabel(confidence)}
            </span>
          </div>
        </div>

        {evidence && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCode size={14} className="text-text-tertiary" />
              <h3 className="text-section text-text-tertiary">EVIDENCE</h3>
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

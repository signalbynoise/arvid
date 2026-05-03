import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function SuccessStep() {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <div className="w-12 h-12 rounded-full bg-status-success-surface flex items-center justify-center">
        <CheckCircle2 size={24} className="text-status-success" />
      </div>
      <p className="text-[15px] font-[var(--fw-medium)] text-text-primary">Extraction Complete</p>
      <p className="text-[13px] text-text-tertiary">Processing requirements into your workspace...</p>
    </div>
  );
}

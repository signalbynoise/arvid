import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function SuccessStep() {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <div className="w-12 h-12 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
        <CheckCircle2 size={24} className="text-[#10b981]" />
      </div>
      <p className="text-[15px] font-[510] text-[#f7f8f8]">Extraction Complete</p>
      <p className="text-[13px] text-[#8a8f98]">Processing requirements into your workspace...</p>
    </div>
  );
}

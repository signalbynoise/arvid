import React, { useState } from 'react';
import { ArrowLeft, UploadCloud, Loader2 } from 'lucide-react';

interface Props {
  onBack: () => void;
  onImport: (text: string) => void;
}

export function ImportFromFiles({ onBack, onImport }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onImport('Imported requirements batch');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-border-strong rounded-panel bg-surface-frost-01 hover:bg-surface-frost-02 hover:border-border-hover transition-all flex flex-col items-center justify-center p-10 cursor-pointer">
        <UploadCloud size={32} className="text-text-tertiary mb-4" />
        <p className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-1">Click or drag files here</p>
        <p className="text-[13px] text-text-quaternary">Supports PDF, DOCX, TXT (Max 50MB)</p>
      </div>
      <div className="flex justify-between items-center pt-3">
        <button onClick={onBack} className="flex items-center space-x-1.5 px-3 py-2 text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors rounded-comfortable hover:bg-surface-frost-04 -ml-2">
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          onClick={handleImport}
          disabled={isProcessing}
          className="px-4 py-2 text-[13px] font-[var(--fw-medium)] rounded-comfortable transition-colors bg-white text-black hover:bg-btn-primary-hover flex items-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Extracting...</span>
            </>
          ) : (
            <span>Extract & Import</span>
          )}
        </button>
      </div>
    </div>
  );
}

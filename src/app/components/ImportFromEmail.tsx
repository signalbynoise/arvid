import React, { useState } from 'react';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';

interface Props {
  onBack: () => void;
  onImport: (text: string) => void;
}

export function ImportFromEmail({ onBack, onImport }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onImport('Imported requirements batch');
    }, 2000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface-frost-02 border border-border-default rounded-card p-5 text-center">
        <Mail size={ICON_SIZE.xl} className="mx-auto text-text-tertiary mb-3" />
        <h3 className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-2">Connect Google Workspace</h3>
        <p className="text-[13px] text-text-tertiary mb-4">Automatically extract requirements from product threads.</p>
        <button className="btn-primary w-full">
          Connect Gmail
        </button>
      </div>
      <div className="flex justify-between items-center pt-3">
        <button onClick={onBack} className="btn-ghost flex items-center space-x-1.5 -ml-2">
          <ArrowLeft size={ICON_SIZE.sm} />
          <span>Back</span>
        </button>
        <button onClick={handleImport} disabled={isProcessing} className="btn-primary flex items-center space-x-2">
          {isProcessing ? (
            <>
              <Loader2 size={ICON_SIZE.sm} className="animate-spin" />
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

import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';

interface Props {
  onBack: () => void;
  onImport: (text: string) => void;
}

export function ImportFromSlack({ onBack, onImport }: Props) {
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
        <MessageSquare size={24} className="mx-auto text-text-tertiary mb-3" />
        <h3 className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-2">Connect Slack Workspace</h3>
        <p className="text-[13px] text-text-tertiary mb-4">Select channels or paste message links to extract knowledge.</p>
        <button className="px-4 py-2 bg-brand-slack text-white text-[13px] font-[var(--fw-medium)] rounded-comfortable hover:bg-brand-slack-hover transition-colors w-full">
          Connect Slack
        </button>
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

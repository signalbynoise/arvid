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
      <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-[12px] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)] transition-all flex flex-col items-center justify-center p-10 cursor-pointer">
        <UploadCloud size={32} className="text-[#8a8f98] mb-4" />
        <p className="text-[14px] font-[510] text-[#f7f8f8] mb-1">Click or drag files here</p>
        <p className="text-[13px] text-[#62666d]">Supports PDF, DOCX, TXT (Max 50MB)</p>
      </div>
      <div className="flex justify-between items-center pt-3">
        <button onClick={onBack} className="flex items-center space-x-1.5 px-3 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors rounded-[6px] hover:bg-[rgba(255,255,255,0.04)] -ml-2">
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          onClick={handleImport}
          disabled={isProcessing}
          className="px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors bg-white text-black hover:bg-[#e0e0e0] flex items-center space-x-2"
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

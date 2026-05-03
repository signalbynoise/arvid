import React from 'react';
import { Paperclip, Mail, MessageSquare } from 'lucide-react';

interface Props {
  text: string;
  validationError: string | null;
  onTextChange: (value: string) => void;
  onNext: () => void;
  onClose: () => void;
  onNavigate: (step: string) => void;
}

export function WriteStep({ text, validationError, onTextChange, onNext, onClose, onNavigate }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">
          Describe the requirement
        </label>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Describe what needs to be built in plain text..."
          autoFocus
          className={`w-full h-32 bg-[rgba(255,255,255,0.02)] border rounded-[8px] p-3 text-[14px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all resize-none ${
            validationError ? 'border-[rgba(239,68,68,0.5)]' : 'border-[rgba(255,255,255,0.08)]'
          }`}
        />
        {validationError && (
          <p className="text-[12px] text-[#ef4444]">{validationError}</p>
        )}
      </div>

      <div>
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]" />
          <span className="text-[11px] font-[510] text-[#62666d] uppercase tracking-widest">Or Import From</span>
          <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => onNavigate('FILE_UPLOAD')} className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors group">
            <Paperclip size={20} className="mb-2 text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors" />
            <span className="text-[12px] font-[510] text-[#8a8f98] group-hover:text-[#d0d6e0]">Files</span>
          </button>
          <button onClick={() => onNavigate('EMAIL_IMPORT')} className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors group">
            <Mail size={20} className="mb-2 text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors" />
            <span className="text-[12px] font-[510] text-[#8a8f98] group-hover:text-[#d0d6e0]">Email</span>
          </button>
          <button onClick={() => onNavigate('SLACK_IMPORT')} className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors group">
            <MessageSquare size={20} className="mb-2 text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors" />
            <span className="text-[12px] font-[510] text-[#8a8f98] group-hover:text-[#d0d6e0]">Slack</span>
          </button>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors">
          Cancel
        </button>
        <button
          onClick={onNext}
          disabled={!text.trim()}
          className={`px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors ${
            !text.trim() ? 'bg-[rgba(255,255,255,0.05)] text-[#62666d] cursor-not-allowed' : 'bg-white text-black hover:bg-[#e0e0e0]'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

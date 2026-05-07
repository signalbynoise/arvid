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
        <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
          Describe the requirement
        </label>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Describe what needs to be built in plain text..."
          autoFocus
          className={`w-full h-32 bg-surface-frost-02 border rounded-card p-3 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all resize-none ${
            validationError ? 'border-status-error-border-focus' : 'border-border-default'
          }`}
        />
        {validationError && (
          <p className="text-[12px] text-status-error">{validationError}</p>
        )}
      </div>

      <div>
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-[1px] flex-1 bg-surface-frost-05" />
          <span className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">Or Import From</span>
          <div className="h-[1px] flex-1 bg-surface-frost-05" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => onNavigate('FILE_UPLOAD')} className="flex flex-col items-center justify-center p-4 bg-surface-frost-02 border border-border-subtle rounded-card hover:bg-surface-frost-04 hover:border-border-strong transition-colors group">
            <Paperclip size={20} className="mb-2 text-text-tertiary group-hover:text-text-secondary transition-colors" />
            <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary group-hover:text-text-secondary">Files</span>
          </button>
          <button onClick={() => onNavigate('EMAIL_IMPORT')} className="flex flex-col items-center justify-center p-4 bg-surface-frost-02 border border-border-subtle rounded-card hover:bg-surface-frost-04 hover:border-border-strong transition-colors group">
            <Mail size={20} className="mb-2 text-text-tertiary group-hover:text-text-secondary transition-colors" />
            <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary group-hover:text-text-secondary">Email</span>
          </button>
          <button onClick={() => onNavigate('SLACK_IMPORT')} className="flex flex-col items-center justify-center p-4 bg-surface-frost-02 border border-border-subtle rounded-card hover:bg-surface-frost-04 hover:border-border-strong transition-colors group">
            <MessageSquare size={20} className="mb-2 text-text-tertiary group-hover:text-text-secondary transition-colors" />
            <span className="text-[12px] font-[var(--fw-medium)] text-text-tertiary group-hover:text-text-secondary">Slack</span>
          </button>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button onClick={onClose} className="btn-ghost px-4 py-1.5">
          Cancel
        </button>
        <button onClick={onNext} disabled={!text.trim()} className="btn-primary px-4 py-1.5">
          Next
        </button>
      </div>
    </div>
  );
}

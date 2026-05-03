import React, { useState } from 'react';
import { X, Sparkles, Paperclip, Mail, MessageSquare, ArrowLeft, UploadCloud, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (text: string) => void;
}

type Step = 'WRITE' | 'FILE_UPLOAD' | 'EMAIL_IMPORT' | 'SLACK_IMPORT' | 'SUCCESS';

export function NewRequirementModal({ isOpen, onClose, onCreate }: Props) {
  const [step, setStep] = useState<Step>('WRITE');
  const [text, setText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleEnhance = () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    // Simulate AI enhancement
    setTimeout(() => {
      setText(`As a system operator, I need to ${text.toLowerCase()} so that we can maintain strict compliance with enterprise standards and ensure audibility across all environments. The system must adhere to standard latency SLAs and be resilient to edge-case failures.`);
      setIsEnhancing(false);
    }, 1500);
  };

  const handleSimulateImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('SUCCESS');
      setTimeout(() => {
        onCreate("Imported requirements batch");
        onClose();
        reset();
      }, 1500);
    }, 2000);
  };

  const handleCreate = () => {
    if (!text.trim()) return;
    onCreate(text);
    onClose();
    reset();
  };

  const reset = () => {
    setStep('WRITE');
    setText('');
    setIsEnhancing(false);
    setIsProcessing(false);
  };

  const renderContent = () => {
    switch (step) {
      case 'WRITE':
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[12px] font-[510] text-[#a78bfa] uppercase tracking-widest flex items-center space-x-1.5">
                  <span>Requirement Definition</span>
                </label>
                <button 
                  onClick={handleEnhance}
                  disabled={!text.trim() || isEnhancing}
                  className={`text-[12px] font-[510] flex items-center space-x-1.5 px-2.5 py-1 rounded-[4px] border transition-all ${
                    !text.trim() || isEnhancing 
                      ? 'border-transparent text-[#62666d] bg-transparent cursor-not-allowed' 
                      : 'border-[rgba(167,139,250,0.3)] text-[#a78bfa] bg-[rgba(167,139,250,0.1)] hover:bg-[rgba(167,139,250,0.15)]'
                  }`}
                >
                  <Sparkles size={12} className={isEnhancing ? 'animate-pulse' : ''} />
                  <span>{isEnhancing ? 'Enhancing...' : 'Enhance'}</span>
                </button>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe the requirement in plain text..."
                className="w-full h-32 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-3 text-[14px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all resize-none shadow-inner"
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]"></div>
                <span className="text-[11px] font-[510] text-[#62666d] uppercase tracking-widest">Or Import From</span>
                <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]"></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setStep('FILE_UPLOAD')} className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors group">
                  <Paperclip size={20} className="mb-2 text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors" />
                  <span className="text-[12px] font-[510] text-[#8a8f98] group-hover:text-[#d0d6e0]">Files</span>
                </button>
                <button onClick={() => setStep('EMAIL_IMPORT')} className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors group">
                  <Mail size={20} className="mb-2 text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors" />
                  <span className="text-[12px] font-[510] text-[#8a8f98] group-hover:text-[#d0d6e0]">Email</span>
                </button>
                <button onClick={() => setStep('SLACK_IMPORT')} className="flex flex-col items-center justify-center p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[8px] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] transition-colors group">
                  <MessageSquare size={20} className="mb-2 text-[#8a8f98] group-hover:text-[#d0d6e0] transition-colors" />
                  <span className="text-[12px] font-[510] text-[#8a8f98] group-hover:text-[#d0d6e0]">Slack</span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'FILE_UPLOAD':
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-[12px] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)] transition-all flex flex-col items-center justify-center p-10 cursor-pointer">
              <UploadCloud size={32} className="text-[#8a8f98] mb-4" />
              <p className="text-[14px] font-[510] text-[#f7f8f8] mb-1">Click or drag files here</p>
              <p className="text-[13px] text-[#62666d]">Supports PDF, DOCX, TXT (Max 50MB)</p>
            </div>
          </div>
        );
      case 'EMAIL_IMPORT':
        return (
          <div className="space-y-5">
            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-5 text-center">
              <Mail size={24} className="mx-auto text-[#8a8f98] mb-3" />
              <h3 className="text-[14px] font-[510] text-[#f7f8f8] mb-2">Connect Google Workspace</h3>
              <p className="text-[13px] text-[#8a8f98] mb-4">Automatically extract requirements from product threads.</p>
              <button className="px-4 py-2 bg-white text-black text-[13px] font-[510] rounded-[6px] hover:bg-[#e0e0e0] transition-colors w-full">
                Connect Gmail
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]"></div>
              <span className="text-[11px] font-[510] text-[#62666d] uppercase tracking-widest">Or Paste Thread</span>
              <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]"></div>
            </div>
            <input type="text" placeholder="https://mail.google.com/mail/u/0/#inbox/..." className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[6px] p-2.5 text-[13px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)]" />
          </div>
        );
      case 'SLACK_IMPORT':
        return (
          <div className="space-y-5">
            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-5 text-center">
              <MessageSquare size={24} className="mx-auto text-[#8a8f98] mb-3" />
              <h3 className="text-[14px] font-[510] text-[#f7f8f8] mb-2">Connect Slack Workspace</h3>
              <p className="text-[13px] text-[#8a8f98] mb-4">Select channels or paste message links to extract knowledge.</p>
              <button className="px-4 py-2 bg-[#611f69] text-white text-[13px] font-[510] rounded-[6px] hover:bg-[#4a154b] transition-colors w-full">
                Connect Slack
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]"></div>
              <span className="text-[11px] font-[510] text-[#62666d] uppercase tracking-widest">Or Paste Link</span>
              <div className="h-[1px] flex-1 bg-[rgba(255,255,255,0.05)]"></div>
            </div>
            <input type="text" placeholder="https://workspace.slack.com/archives/..." className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[6px] p-2.5 text-[13px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)]" />
          </div>
        );
      case 'SUCCESS':
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
  };

  const renderFooter = () => {
    if (step === 'SUCCESS') return null;

    if (step === 'WRITE') {
      return (
        <div className="flex justify-end space-x-3 pt-5 mt-2 border-t border-[rgba(255,255,255,0.05)]">
          <button onClick={() => { onClose(); reset(); }} className="px-4 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!text.trim()}
            className={`px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors ${
              !text.trim() ? 'bg-[rgba(255,255,255,0.05)] text-[#62666d] cursor-not-allowed' : 'bg-white text-black hover:bg-[#e0e0e0]'
            }`}
          >
            Create
          </button>
        </div>
      );
    }

    return (
      <div className="flex justify-between items-center pt-5 mt-2 border-t border-[rgba(255,255,255,0.05)]">
        <button onClick={() => setStep('WRITE')} className="flex items-center space-x-1.5 px-3 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors rounded-[6px] hover:bg-[rgba(255,255,255,0.04)] -ml-2">
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button 
          onClick={handleSimulateImport}
          disabled={isProcessing}
          className="px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors bg-white text-black hover:bg-[#e0e0e0] flex items-center space-x-2"
        >
          {isProcessing ? (
            <span className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 border-2 border-[rgba(0,0,0,0.2)] border-t-black rounded-full animate-spin"></span>
              <span>Extracting...</span>
            </span>
          ) : (
            <span>Extract & Import</span>
          )}
        </button>
      </div>
    );
  };

  const getTitle = () => {
    switch (step) {
      case 'WRITE': return 'New Requirement';
      case 'FILE_UPLOAD': return 'Import from Files';
      case 'EMAIL_IMPORT': return 'Import from Email';
      case 'SLACK_IMPORT': return 'Import from Slack';
      case 'SUCCESS': return 'Success';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#08090a]/80 backdrop-blur-sm transition-opacity"
        onClick={() => { onClose(); reset(); }}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[520px] bg-[#0f1011] border border-[rgba(255,255,255,0.1)] rounded-[12px] shadow-[0_24px_40px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.05)]">
          <h2 className="text-[14px] font-[510] text-[#f7f8f8]">{getTitle()}</h2>
          <button 
            onClick={() => { onClose(); reset(); }}
            className="text-[#62666d] hover:text-[#f7f8f8] transition-colors p-1 rounded-[4px] hover:bg-[rgba(255,255,255,0.05)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {renderContent()}
          {renderFooter()}
        </div>
      </div>
    </div>
  );
}

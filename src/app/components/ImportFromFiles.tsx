import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, UploadCloud, Loader2, FileText, Check, Sparkles, AlertCircle, X } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore } from '../store';
import { api } from '../api';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { SubmitButton } from './ui/SubmitButton';
import { DocumentPreview } from './document/DocumentPreview';
import { ExtractedRequirementCard } from './document/ExtractedRequirementCard';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

type DocumentStep = 'upload' | 'processing' | 'review' | 'creating';

interface ExtractedRequirement {
  title: string;
  description: string;
  clarity: string;
  risk: string;
  selected: boolean;
}

interface Props {
  onBack: () => void;
  onImport: (text: string) => void;
  onImportMultiple?: (items: Array<{ title: string; description: string }>) => void;
  onWideChange?: (wide: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (${formatFileSize(file.size)}). Maximum is 10 MB.`;
  }
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !SUPPORTED_EXTENSIONS.includes(`.${ext}`)) {
      return 'Unsupported file type. Please use PDF, DOCX, TXT, or MD.';
    }
  }
  return null;
}

export function ImportFromFiles({ onBack, onImport, onImportMultiple, onWideChange }: Props) {
  const selectedProjectId = useStore(s => s.selectedProjectId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<DocumentStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('Uploading...');
  const [requirements, setRequirements] = useState<ExtractedRequirement[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');

  useEffect(() => {
    onWideChange?.(step === 'review');
  }, [step, onWideChange]);

  useEffect(() => {
    if (step !== 'processing' || !uploadId) return;

    const channel = supabase
      .channel(`document-upload-${uploadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'document_uploads',
          filter: `id=eq.${uploadId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          if (newStatus === 'completed') {
            handleProcessingComplete();
          } else if (newStatus === 'failed') {
            const errorMsg = (payload.new as { error_message?: string }).error_message;
            handleProcessingFailed(errorMsg ?? 'Processing failed');
          }
        },
      )
      .subscribe();

    const pollInterval = setInterval(async () => {
      try {
        const status = await api.getDocumentStatus(uploadId);
        if (status.status === 'completed') {
          handleProcessingComplete();
        } else if (status.status === 'failed') {
          handleProcessingFailed(status.error_message ?? 'Processing failed');
        }
      } catch {
        // Polling failure is non-fatal; Realtime is primary
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [step, uploadId]);

  const handleProcessingComplete = useCallback(async () => {
    if (!uploadId) return;
    try {
      const [results, preview] = await Promise.all([
        api.getDocumentResults(uploadId),
        api.getDocumentPreviewUrl(uploadId),
      ]);

      setFilename(results.filename);
      setRequirements(
        results.requirements.map(r => ({ ...r, selected: true })),
      );
      setPreviewUrl(preview.url);
      setStep('review');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load results';
      toast.error(message);
      setStep('upload');
    }
  }, [uploadId]);

  const handleProcessingFailed = useCallback((errorMessage: string) => {
    toast.error(`Document processing failed: ${errorMessage}`);
    setStep('upload');
  }, []);

  const handleFileSelect = (file: File) => {
    const error = isValidFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedProjectId) return;
    setStep('processing');
    setProcessingStatus('Uploading document...');

    try {
      const result = await api.uploadDocument(selectedProjectId, selectedFile);
      setUploadId(result.uploadId);
      setProcessingStatus('Extracting text and analyzing...');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
      setStep('upload');
    }
  };

  const toggleRequirement = (index: number) => {
    setRequirements(prev =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)),
    );
  };

  const updateRequirement = (index: number, updates: Partial<ExtractedRequirement>) => {
    setRequirements(prev =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    );
  };

  const handleConfirm = async () => {
    if (!uploadId) return;
    const selected = requirements.filter(r => r.selected);
    if (selected.length === 0) {
      toast.error('Select at least one requirement');
      return;
    }

    setStep('creating');

    try {
      await api.confirmDocumentRequirements(
        uploadId,
        selected.map(r => ({
          title: r.title,
          description: r.description,
          clarity: r.clarity,
          risk: r.risk,
        })),
      );

      if (onImportMultiple) {
        onImportMultiple(selected.map(r => ({ title: r.title, description: r.description })));
      } else {
        onImport(selected.map(r => `${r.title}\n\n${r.description}`).join('\n\n---\n\n'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create requirements';
      toast.error(message);
      setStep('review');
    }
  };

  // --- UPLOAD STEP ---
  if (step === 'upload') {
    return (
      <div className="space-y-5">
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border-strong rounded-panel bg-surface-frost-01 hover:bg-surface-frost-02 hover:border-border-hover transition-all flex flex-col items-center justify-center p-10 cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_EXTENSIONS.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />
          <UploadCloud size={ICON_SIZE['2xl']} className="text-text-tertiary mb-4" />
          <p className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-1">
            Click or drag files here
          </p>
          <p className="text-[13px] text-text-quaternary">
            Supports PDF, DOCX, TXT, MD (Max 10 MB)
          </p>
        </div>

        {fileError && (
          <div className="flex items-center gap-2 text-[13px] text-status-danger">
            <AlertCircle size={ICON_SIZE.sm} />
            <span>{fileError}</span>
          </div>
        )}

        {selectedFile && !fileError && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-comfortable border border-border-default bg-surface-frost-02">
            <FileText size={ICON_SIZE.md} className="text-text-tertiary shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-[var(--fw-medium)] text-text-primary truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-text-quaternary">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="p-1 rounded-standard hover:bg-surface-frost-04 text-text-quaternary"
            >
              <X size={ICON_SIZE.sm} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <button onClick={onBack} className="btn-ghost flex items-center space-x-1.5 -ml-2">
            <ArrowLeft size={ICON_SIZE.sm} />
            <span>Back</span>
          </button>
          <SubmitButton
            onClick={handleUpload}
            disabled={!selectedFile || !selectedProjectId}
            label="Extract Requirements"
          />
        </div>
      </div>
    );
  }

  // --- PROCESSING STEP ---
  if (step === 'processing') {
    return (
      <div className="space-y-5">
        <div className="bg-surface-frost-02 border border-border-default rounded-card p-8 text-center">
          <Loader2 size={ICON_SIZE.xl} className="mx-auto text-text-tertiary mb-3 animate-spin" />
          <h3 className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-2">
            Processing Document
          </h3>
          <p className="text-[13px] text-text-tertiary">
            {processingStatus}
          </p>
        </div>
      </div>
    );
  }

  // --- CREATING STEP ---
  if (step === 'creating') {
    return (
      <div className="space-y-5">
        <div className="bg-surface-frost-02 border border-border-default rounded-card p-8 text-center">
          <Loader2 size={ICON_SIZE.xl} className="mx-auto text-text-tertiary mb-3 animate-spin" />
          <h3 className="text-[14px] font-[var(--fw-medium)] text-text-primary mb-2">
            Creating Requirements
          </h3>
          <p className="text-[13px] text-text-tertiary">
            Saving {requirements.filter(r => r.selected).length} requirement{requirements.filter(r => r.selected).length !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    );
  }

  // --- REVIEW STEP (split-pane) ---
  const selectedCount = requirements.filter(r => r.selected).length;

  return (
    <div className="flex flex-col min-h-[500px]">
      <div className="flex flex-1 min-h-0">
        {/* Left: Document Preview */}
        <div className="w-1/2 border-r border-border-subtle overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest mb-2">
              Source Document
            </p>
            <p className="text-[12px] text-text-tertiary truncate">{filename}</p>
          </div>
          <DocumentPreview url={previewUrl} mimeType={selectedFile?.type ?? ''} filename={filename} />
        </div>

        {/* Right: Extracted Requirements */}
        <div className="w-1/2 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} className="text-text-tertiary" />
            <p className="text-[11px] font-[var(--fw-medium)] text-text-quaternary uppercase tracking-widest">
              Extracted Requirements ({requirements.length})
            </p>
          </div>

          {requirements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[13px] text-text-quaternary">
                No actionable requirements found in this document.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requirements.map((r, i) => (
                <ExtractedRequirementCard
                  key={i}
                  requirement={r}
                  onToggle={() => toggleRequirement(i)}
                  onUpdate={(updates) => updateRequirement(i, updates)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-border-subtle shrink-0">
        <button
          onClick={() => { setStep('upload'); onWideChange?.(false); }}
          className="btn-ghost flex items-center space-x-1.5"
        >
          <ArrowLeft size={ICON_SIZE.sm} />
          <span>Upload another</span>
        </button>
        <SubmitButton
          onClick={handleConfirm}
          disabled={selectedCount === 0}
          label={`Create ${selectedCount} Requirement${selectedCount !== 1 ? 's' : ''}`}
        />
      </div>
    </div>
  );
}

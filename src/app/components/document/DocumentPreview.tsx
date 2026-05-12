import React from 'react';
import { FileText } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';

interface Props {
  url: string | null;
  mimeType: string;
  filename: string;
}

const PDF_MIME = 'application/pdf';

export function DocumentPreview({ url, mimeType, filename }: Props) {
  if (!url) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <FileText size={ICON_SIZE['2xl']} className="mx-auto text-text-quaternary mb-3" />
          <p className="text-[13px] text-text-quaternary">Preview not available</p>
        </div>
      </div>
    );
  }

  if (mimeType === PDF_MIME) {
    const pdfUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0`;
    return (
      <iframe
        src={pdfUrl}
        title={`Preview: ${filename}`}
        className="w-full h-full min-h-[400px] border-0 rounded-comfortable"
      />
    );
  }

  return (
    <div className="p-4">
      <div className="rounded-comfortable border border-border-default bg-surface-frost-01 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-subtle">
          <FileText size={ICON_SIZE.sm} className="text-text-quaternary" />
          <span className="text-[12px] font-[var(--fw-medium)] text-text-secondary truncate">
            {filename}
          </span>
        </div>
        <p className="text-[12px] text-text-tertiary">
          Text-based document uploaded. Requirements have been extracted from its content.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-[12px] text-text-link hover:underline"
        >
          Download original file
        </a>
      </div>
    </div>
  );
}

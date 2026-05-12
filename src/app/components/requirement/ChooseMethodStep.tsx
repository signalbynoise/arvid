import React from 'react';
import { File, LoaderPinwheel, ChevronRight } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';

interface Props {
  onNavigate: (step: string) => void;
  onClose: () => void;
}

export function ChooseMethodStep({ onNavigate, onClose }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onNavigate('WRITE')}
        className="w-full flex items-center justify-between bg-btn-primary rounded-comfortable p-3 cursor-pointer hover:bg-btn-primary-hover transition-colors"
      >
        <span className="flex items-center gap-2">
          <LoaderPinwheel size={ICON_SIZE.sm} className="text-text-on-primary" />
          <span className="text-btn text-text-on-primary">Write with Arvid</span>
        </span>
        <ChevronRight size={ICON_SIZE.sm} className="text-text-on-primary" />
      </button>

      <button
        type="button"
        onClick={() => onNavigate('FILE_UPLOAD')}
        className="w-full flex items-center justify-between bg-surface-elevated border border-border-default rounded-comfortable p-3 cursor-pointer hover:bg-surface-frost-04 transition-colors"
      >
        <span className="flex items-center gap-2">
          <File size={ICON_SIZE.sm} className="text-text-quaternary" />
          <span className="text-btn text-text-tertiary">Process requirements from uploaded files</span>
        </span>
        <ChevronRight size={ICON_SIZE.sm} className="text-text-quaternary" />
      </button>

      <button
        type="button"
        onClick={() => onNavigate('SLACK_IMPORT')}
        className="w-full flex items-center justify-between bg-surface-elevated border border-border-default rounded-comfortable p-3 cursor-pointer hover:bg-surface-frost-04 transition-colors"
      >
        <span className="flex items-center gap-2">
          <img src="/slack.svg" alt="" className="w-3.5 h-3.5 shrink-0" />
          <span className="text-btn text-text-tertiary">Process requirements from Slack channels</span>
        </span>
        <ChevronRight size={ICON_SIZE.sm} className="text-text-quaternary" />
      </button>

      <button
        type="button"
        onClick={() => onNavigate('EMAIL_IMPORT')}
        className="w-full flex items-center justify-between bg-surface-elevated border border-border-default rounded-comfortable p-3 cursor-pointer hover:bg-surface-frost-04 transition-colors"
      >
        <span className="flex items-center gap-2">
          <img src="/gmail.svg" alt="" className="w-3.5 h-3.5 shrink-0" />
          <span className="text-btn text-text-tertiary">Process requirements from emails</span>
        </span>
        <ChevronRight size={ICON_SIZE.sm} className="text-text-quaternary" />
      </button>
    </div>
  );
}

import React from 'react';
import { File, LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { FormField } from '../ui/FormField';
import { TextArea } from '../ui/TextArea';
import { ActionRow } from '../ui/ActionRow';

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
    <div className="flex flex-col gap-6">
      <FormField label="Free Text" error={validationError}>
        <TextArea
          value={text}
          onChange={onTextChange}
          placeholder="Describe what needs to be built in plain text..."
          hasError={!!validationError}
          autoFocus
        />
      </FormField>

      <FormField label="External Sources">
        <div className="flex flex-col gap-2">
          <ActionRow icon={<File size={ICON_SIZE.md} />} label="Process from documents" onClick={() => onNavigate('FILE_UPLOAD')} />
          <ActionRow icon={<img src="/gmail.svg" alt="" className="w-4 h-4" />} label="Process from Gmail" onClick={() => onNavigate('EMAIL_IMPORT')} />
          <ActionRow icon={<img src="/slack.svg" alt="" className="w-4 h-4" />} label="Process from Slack" onClick={() => onNavigate('SLACK_IMPORT')} />
        </div>
      </FormField>

      <div className="flex justify-end gap-3 pt-6">
        <button onClick={onClose} className="btn-ghost">
          Cancel
        </button>
        <button onClick={onNext} disabled={!text.trim()} className="btn-primary flex items-center gap-2">
          <LoaderPinwheel size={ICON_SIZE.md} />
          <span>Check with Arvid</span>
        </button>
      </div>
    </div>
  );
}

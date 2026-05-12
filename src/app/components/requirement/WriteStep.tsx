import React from 'react';
import { LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { FormField } from '../ui/FormField';
import { TextArea } from '../ui/TextArea';
import { FigmaLinksField } from './FigmaLinksField';
import { FigmaConnectPrompt } from './FigmaConnectPrompt';
import { useStore } from '../../store';

interface Props {
  text: string;
  validationError: string | null;
  figmaLinks: string[];
  onTextChange: (value: string) => void;
  onFigmaLinksChange: (links: string[]) => void;
  onNext: () => void;
  onClose: () => void;
}

export function WriteStep({ text, validationError, figmaLinks, onTextChange, onFigmaLinksChange, onNext, onClose }: Props) {
  const figmaConnection = useStore(s => s.figmaConnection);
  const isConnected = figmaConnection.status === 'connected';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-10">
        <div className="flex-1 min-w-0">
          <FormField label="Free Text" error={validationError}>
            <TextArea
              value={text}
              onChange={onTextChange}
              placeholder="Write your requirement in plain text and have Arvid enhance it automatically based on your prior requirements, codebase, and database"
              hasError={!!validationError}
              autoFocus
            />
          </FormField>
        </div>

        <div className="flex-1 min-w-0">
          {isConnected ? (
            <FigmaLinksField
              links={figmaLinks}
              onChange={onFigmaLinksChange}
            />
          ) : (
            <FigmaConnectPrompt />
          )}
        </div>
      </div>

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

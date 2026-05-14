import React from 'react';
import { ChooseMethodStep } from './ChooseMethodStep';
import { WriteStep } from './WriteStep';
import { EnhanceStep } from './EnhanceStep';
import { SuccessStep } from './SuccessStep';
import { ImportFromFiles } from '../ImportFromFiles';
import { ImportFromEmail } from '../ImportFromEmail';
import { ImportFromSlack } from '../ImportFromSlack';

type Step = 'CHOOSE' | 'WRITE' | 'ENHANCE' | 'FILE_UPLOAD' | 'EMAIL_IMPORT' | 'SLACK_IMPORT' | 'SUCCESS';

interface StepContentProps {
  step: Step;
  rawText: string;
  validationError: string | null;
  figmaLinks: string[];
  isEnhancing: boolean;
  title: string;
  description: string;
  figmaDesigns: Array<{ url: string; thumbnailUrl?: string; nodeName?: string }>;
  scores: { clarity?: number; risk?: number } | null;
  onTextChange: (v: string) => void;
  onFigmaLinksChange: (links: string[]) => void;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onNext: () => void;
  onBack: (target: string) => void;
  onCreate: () => void;
  onClose: () => void;
  onImportComplete: (text: string) => void;
  onImportMultiple: (items: Array<{ title: string; description: string }>) => Promise<void>;
  onWideChange: (wide: boolean) => void;
  renderSidebar: (sidebar: React.ReactNode) => void;
  renderFooter: (footer: React.ReactNode | undefined) => void;
}

export function StepContent({
  step, rawText, validationError, figmaLinks, isEnhancing, title, description,
  figmaDesigns, scores, onTextChange, onFigmaLinksChange, onTitleChange,
  onDescriptionChange, onNext, onBack, onCreate, onClose,
  onImportComplete, onImportMultiple, onWideChange, renderSidebar, renderFooter,
}: StepContentProps) {
  switch (step) {
    case 'CHOOSE':
      return <ChooseMethodStep onNavigate={onBack} onClose={onClose} />;
    case 'WRITE':
      return (
        <WriteStep
          text={rawText}
          validationError={validationError}
          figmaLinks={figmaLinks}
          onTextChange={onTextChange}
          onFigmaLinksChange={onFigmaLinksChange}
          onNext={onNext}
          onClose={onClose}
        />
      );
    case 'ENHANCE':
      return (
        <EnhanceStep
          isEnhancing={isEnhancing}
          title={title}
          description={description}
          figmaDesigns={figmaDesigns}
          scores={scores}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onBack={() => onBack('WRITE')}
          onCreate={onCreate}
          renderSidebar={renderSidebar}
          renderFooter={renderFooter}
        />
      );
    case 'FILE_UPLOAD':
      return (
        <ImportFromFiles
          onBack={() => onBack('CHOOSE')}
          onImport={onImportComplete}
          onImportMultiple={onImportMultiple}
          onWideChange={onWideChange}
          renderFooter={renderFooter}
        />
      );
    case 'EMAIL_IMPORT':
      return <ImportFromEmail onBack={() => onBack('CHOOSE')} onImport={onImportComplete} />;
    case 'SLACK_IMPORT':
      return (
        <ImportFromSlack
          onBack={() => { onBack('CHOOSE'); onWideChange(false); }}
          onImport={onImportComplete}
          onImportMultiple={onImportMultiple}
          onWideChange={onWideChange}
        />
      );
    case 'SUCCESS':
      return <SuccessStep />;
  }
}

import React, { useState } from 'react';
import { useStore, selectSelectedProjectId } from '../store';
import { RequirementInputSchema } from '../../../shared/schemas';
import { BaseModal } from './BaseModal';
import { WriteStep } from './requirement/WriteStep';
import { EnhanceStep } from './requirement/EnhanceStep';
import { SuccessStep } from './requirement/SuccessStep';
import { ImportFromFiles } from './ImportFromFiles';
import { ImportFromEmail } from './ImportFromEmail';
import { ImportFromSlack } from './ImportFromSlack';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'WRITE' | 'ENHANCE' | 'FILE_UPLOAD' | 'EMAIL_IMPORT' | 'SLACK_IMPORT' | 'SUCCESS';

const STEP_TITLES: Record<Step, string> = {
  WRITE: 'New Requirement',
  ENHANCE: 'Review Requirement',
  FILE_UPLOAD: 'Import from Files',
  EMAIL_IMPORT: 'Import from Email',
  SLACK_IMPORT: 'Import from Slack',
  SUCCESS: 'Success',
};

export function NewRequirementModal({ isOpen, onClose }: Props) {
  const createRequirement = useStore(s => s.createRequirement);
  const enhanceRequirement = useStore(s => s.enhanceRequirement);
  const selectedProjectId = useStore(selectSelectedProjectId);

  const [step, setStep] = useState<Step>('WRITE');
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const reset = () => {
    setStep('WRITE');
    setRawText('');
    setTitle('');
    setDescription('');
    setValidationError(null);
    setIsEnhancing(false);
  };

  const handleClose = () => { onClose(); reset(); };

  const handleNext = async () => {
    const result = RequirementInputSchema.safeParse({ text: rawText.trim() });
    if (!result.success) { setValidationError(result.error.issues[0].message); return; }
    setValidationError(null);
    setStep('ENHANCE');
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceRequirement(rawText.trim(), selectedProjectId);
      setTitle(enhanced.title);
      setDescription(enhanced.description);
    } catch {
      setTitle('');
      setDescription(rawText.trim());
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCreate = () => {
    if (!description.trim()) return;
    createRequirement(description.trim(), title.trim() || undefined);
    handleClose();
  };

  const handleImportComplete = (text: string) => {
    setStep('SUCCESS');
    setTimeout(() => { createRequirement(text); handleClose(); }, 1500);
  };

  const renderStep = () => {
    switch (step) {
      case 'WRITE':
        return (
          <WriteStep
            text={rawText}
            validationError={validationError}
            onTextChange={(v) => { setRawText(v); setValidationError(null); }}
            onNext={handleNext}
            onClose={handleClose}
            onNavigate={(s) => setStep(s as Step)}
          />
        );
      case 'ENHANCE':
        return (
          <EnhanceStep
            isEnhancing={isEnhancing}
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onBack={() => setStep('WRITE')}
            onCreate={handleCreate}
          />
        );
      case 'FILE_UPLOAD':
        return <ImportFromFiles onBack={() => setStep('WRITE')} onImport={handleImportComplete} />;
      case 'EMAIL_IMPORT':
        return <ImportFromEmail onBack={() => setStep('WRITE')} onImport={handleImportComplete} />;
      case 'SLACK_IMPORT':
        return <ImportFromSlack onBack={() => setStep('WRITE')} onImport={handleImportComplete} />;
      case 'SUCCESS':
        return <SuccessStep />;
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={STEP_TITLES[step]} size="lg">
      {renderStep()}
    </BaseModal>
  );
}

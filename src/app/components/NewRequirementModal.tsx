import React, { useState, useMemo, useEffect } from 'react';
import { useStore, selectSelectedProjectId, selectProjects } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { RequirementInputSchema } from '../../../shared/schemas';
import { isValidFigmaUrl } from '../../../shared/figmaUrl';
import { BaseModal } from './BaseModal';
import { ChooseMethodStep } from './requirement/ChooseMethodStep';
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

type Step = 'CHOOSE' | 'WRITE' | 'ENHANCE' | 'FILE_UPLOAD' | 'EMAIL_IMPORT' | 'SLACK_IMPORT' | 'SUCCESS';

const STEP_TITLES: Record<Step, string> = {
  CHOOSE: 'New Requirement',
  WRITE: 'New Requirement',
  ENHANCE: 'New Requirement',
  FILE_UPLOAD: 'Import from Files',
  EMAIL_IMPORT: 'Import from Email',
  SLACK_IMPORT: 'Import from Slack',
  SUCCESS: 'Success',
};

const WIDE_STEPS: Set<Step> = new Set(['WRITE', 'ENHANCE']);

export function NewRequirementModal({ isOpen, onClose }: Props) {
  const createRequirement = useStore(s => s.createRequirement);
  const enhanceRequirement = useStore(s => s.enhanceRequirement);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const projects = useStore(selectProjects);
  const { user } = useAuth();

  const hasRepoContext = useMemo(() => {
    const project = projects.find(p => p.id === selectedProjectId);
    return !!project?.githubRepo;
  }, [projects, selectedProjectId]);

  const ownerName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || 'Unknown';

  const [step, setStep] = useState<Step>('CHOOSE');
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [slackWideMode, setSlackWideMode] = useState(false);
  const [figmaLinks, setFigmaLinks] = useState<string[]>([]);

  const resolveFigmaDesigns = useStore(s => s.resolveFigmaDesigns);
  const resolvedDesigns = useStore(s => s.resolvedDesigns);

  const validFigmaLinks = useMemo(
    () => figmaLinks.filter(link => link.trim() && isValidFigmaUrl(link)),
    [figmaLinks],
  );

  const figmaDesigns = useMemo(
    () => resolvedDesigns.length > 0
      ? resolvedDesigns.map(d => ({ url: d.url, thumbnailUrl: d.thumbnailUrl ?? undefined, nodeName: d.nodeName }))
      : validFigmaLinks.map(url => ({ url })),
    [resolvedDesigns, validFigmaLinks],
  );

  const reset = () => {
    setStep('CHOOSE');
    setRawText('');
    setTitle('');
    setDescription('');
    setValidationError(null);
    setIsEnhancing(false);
    setSlackWideMode(false);
    setFigmaLinks([]);
  };

  const handleClose = () => { onClose(); reset(); };

  const handleNext = async () => {
    const result = RequirementInputSchema.safeParse({ text: rawText.trim() });
    if (!result.success) { setValidationError(result.error.issues[0].message); return; }
    setValidationError(null);
    setStep('ENHANCE');
    setIsEnhancing(true);

    if (validFigmaLinks.length > 0) {
      resolveFigmaDesigns(validFigmaLinks);
    }

    try {
      const linksForAI = validFigmaLinks.length > 0 ? validFigmaLinks : undefined;
      const enhanced = await enhanceRequirement(rawText.trim(), selectedProjectId, linksForAI);
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
    const linksToSave = validFigmaLinks.length > 0 ? validFigmaLinks : undefined;
    createRequirement(description.trim(), ownerName, title.trim() || undefined, linksToSave);
    handleClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault();
        if (step === 'WRITE' && rawText.trim()) handleNext();
        else if (step === 'ENHANCE' && description.trim() && !isEnhancing) handleCreate();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  });

  const handleImportComplete = (text: string) => {
    setStep('SUCCESS');
    setTimeout(() => { createRequirement(text, ownerName); handleClose(); }, 1500);
  };

  const handleImportMultiple = async (items: Array<{ title: string; description: string }>) => {
    setStep('SUCCESS');
    for (const item of items) {
      await createRequirement(item.description, ownerName, item.title);
    }
    setTimeout(() => handleClose(), 1200);
  };

  const handleNavigate = (target: string) => {
    setStep(target as Step);
  };

  const renderStep = () => {
    switch (step) {
      case 'CHOOSE':
        return (
          <ChooseMethodStep
            onNavigate={handleNavigate}
            onClose={handleClose}
          />
        );
      case 'WRITE':
        return (
          <WriteStep
            text={rawText}
            validationError={validationError}
            figmaLinks={figmaLinks}
            onTextChange={(v) => { setRawText(v); setValidationError(null); }}
            onFigmaLinksChange={setFigmaLinks}
            onNext={handleNext}
            onClose={handleClose}
          />
        );
      case 'ENHANCE':
        return (
          <EnhanceStep
            isEnhancing={isEnhancing}
            title={title}
            description={description}
            hasRepoContext={hasRepoContext}
            figmaDesigns={figmaDesigns}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onBack={() => setStep('WRITE')}
            onCreate={handleCreate}
          />
        );
      case 'FILE_UPLOAD':
        return <ImportFromFiles onBack={() => setStep('CHOOSE')} onImport={handleImportComplete} onImportMultiple={handleImportMultiple} onWideChange={setSlackWideMode} />;
      case 'EMAIL_IMPORT':
        return <ImportFromEmail onBack={() => setStep('CHOOSE')} onImport={handleImportComplete} />;
      case 'SLACK_IMPORT':
        return <ImportFromSlack onBack={() => { setStep('CHOOSE'); setSlackWideMode(false); }} onImport={handleImportComplete} onImportMultiple={handleImportMultiple} onWideChange={setSlackWideMode} />;
      case 'SUCCESS':
        return <SuccessStep />;
    }
  };

  const isImportWide = (step === 'SLACK_IMPORT' || step === 'FILE_UPLOAD') && slackWideMode;
  const isWriteWide = WIDE_STEPS.has(step);
  const modalSize = isImportWide ? 'xl' : isWriteWide ? 'wide' : 'lg';

  const modalTitle = step === 'ENHANCE' && isEnhancing
    ? 'Processing new requirement'
    : STEP_TITLES[step];

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={modalTitle} size={modalSize}>
      {renderStep()}
    </BaseModal>
  );
}

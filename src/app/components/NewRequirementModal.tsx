import React, { useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { useStore, selectSelectedProjectId, selectPendingScores } from '../store';
import { useAuth } from '../auth/AuthProvider';
import { RequirementInputSchema } from '../../../shared/schemas';
import { isValidFigmaUrl } from '../../../shared/figmaUrl';
import { BaseModal } from './BaseModal';
import { StepContent } from './requirement/StepContent';

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

export function NewRequirementModal({ isOpen, onClose }: Props) {
  const createRequirement = useStore(s => s.createRequirement);
  const enhanceRequirement = useStore(s => s.enhanceRequirement);
  const selectedProjectId = useStore(selectSelectedProjectId);
  const pendingScores = useStore(selectPendingScores);
  const { user } = useAuth();

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
  const [modalSidebar, setModalSidebar] = useState<ReactNode>(null);
  const [modalFooter, setModalFooter] = useState<ReactNode | undefined>(undefined);

  const resolveFigmaDesigns = useStore(s => s.resolveFigmaDesigns);
  const clearResolvedDesigns = useStore(s => s.clearResolvedDesigns);
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

  const handleSetSidebar = useCallback((sidebar: ReactNode) => setModalSidebar(sidebar), []);
  const handleSetFooter = useCallback((footer: ReactNode | undefined) => setModalFooter(footer), []);

  const reset = () => {
    setStep('CHOOSE');
    setRawText('');
    setTitle('');
    setDescription('');
    setValidationError(null);
    setIsEnhancing(false);
    setSlackWideMode(false);
    setFigmaLinks([]);
    setModalSidebar(null);
    setModalFooter(undefined);
    clearResolvedDesigns();
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

  const isImportWide = (step === 'SLACK_IMPORT' || step === 'FILE_UPLOAD') && slackWideMode;
  const isEnhanceStep = step === 'ENHANCE';
  const isFileUploadStep = step === 'FILE_UPLOAD';
  const modalSize = isImportWide ? 'xl' : isEnhanceStep ? 'xl' : step === 'WRITE' ? 'wide' : 'lg';

  const modalTitle = step === 'ENHANCE' && isEnhancing
    ? 'Processing new requirement'
    : STEP_TITLES[step];

  const activeSidebar = isEnhanceStep ? modalSidebar : undefined;
  const activeFooter = (isEnhanceStep || isFileUploadStep) ? modalFooter : undefined;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size={modalSize}
      sidebar={activeSidebar}
      footer={activeFooter}
    >
      <StepContent
        step={step}
        rawText={rawText}
        validationError={validationError}
        figmaLinks={figmaLinks}
        isEnhancing={isEnhancing}
        title={title}
        description={description}
        figmaDesigns={figmaDesigns}
        scores={pendingScores}
        onTextChange={(v) => { setRawText(v); setValidationError(null); }}
        onFigmaLinksChange={setFigmaLinks}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onNext={handleNext}
        onBack={handleNavigate}
        onCreate={handleCreate}
        onClose={handleClose}
        onImportComplete={handleImportComplete}
        onImportMultiple={handleImportMultiple}
        onWideChange={setSlackWideMode}
        renderSidebar={handleSetSidebar}
        renderFooter={handleSetFooter}
      />
    </BaseModal>
  );
}

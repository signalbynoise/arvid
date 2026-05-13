import React, { useEffect, useRef } from 'react';
import { ArrowLeft, LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';
import { SubmitButton } from '../ui/SubmitButton';
import { FigmaDesignGrid } from './FigmaDesignGrid';
import { ScoreBadge } from '../ScoreBadge';

interface FigmaDesign {
  url: string;
  thumbnailUrl?: string;
  nodeName?: string;
}

interface ScoreAnalysis {
  clarityScore?: number;
  riskScore?: number;
  clarityReasoning?: string;
  riskReasoning?: string;
}

interface Props {
  isEnhancing: boolean;
  title: string;
  description: string;
  figmaDesigns: FigmaDesign[];
  scores?: ScoreAnalysis | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBack: () => void;
  onCreate: () => void;
}

export function EnhanceStep({ isEnhancing, title, description, figmaDesigns, scores, onTitleChange, onDescriptionChange, onBack, onCreate }: Props) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEnhancing && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isEnhancing]);

  if (isEnhancing) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <LoaderPinwheel size={ICON_SIZE.xl} className="text-text-tertiary animate-spin" />
        <p className="text-caption-lg text-text-tertiary">
          Arvid is analyzing your requirement
        </p>
      </div>
    );
  }

  const hasFigmaDesigns = figmaDesigns.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-10">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <FormField label="Title">
            <TextInput
              value={title}
              onChange={onTitleChange}
              placeholder="Requirement title"
            />
          </FormField>

          <FormField label="Requirement">
            <TextArea
              value={description}
              onChange={onDescriptionChange}
              textareaRef={descriptionRef}
              className="min-h-[240px]"
            />
          </FormField>
        </div>

        {hasFigmaDesigns && (
          <div className="flex-1 min-w-0 self-stretch">
            <FigmaDesignGrid designs={figmaDesigns} />
          </div>
        )}
      </div>

      {scores?.clarityScore != null && scores?.riskScore != null && (
        <div className="rounded-card bg-surface-frost-02 border border-border-default p-4 space-y-3">
          <span className="text-[11px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">
            Analysis
          </span>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <ScoreBadge label="Clarity" score={scores.clarityScore} />
              </div>
              {scores.clarityReasoning && (
                <p className="text-caption-lg text-text-tertiary">{scores.clarityReasoning}</p>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <ScoreBadge label="Risk" score={scores.riskScore} invert />
              </div>
              {scores.riskReasoning && (
                <p className="text-caption-lg text-text-tertiary">{scores.riskReasoning}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1.5 -ml-2">
          <ArrowLeft size={ICON_SIZE.sm} />
          <span>Back</span>
        </button>
        <SubmitButton onClick={onCreate} disabled={!description.trim()} label="Create new requirement" />
      </div>
    </div>
  );
}

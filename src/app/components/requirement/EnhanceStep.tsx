import React, { useState, useEffect, useRef } from 'react';
import { LoaderPinwheel, Pencil, Image, BarChart3 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';
import { ModalSidebar } from '../ui/ModalSidebar';
import type { ModalSidebarItem } from '../ui/ModalSidebar';
import { ModalFooter } from '../ui/ModalFooter';
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

type EnhanceTab = 'general' | 'designs' | 'analysis';

const TAB_CONFIG: ModalSidebarItem[] = [
  { id: 'general', label: 'General', icon: <Pencil size={ICON_SIZE.sm} /> },
  { id: 'designs', label: 'Design Files', icon: <Image size={ICON_SIZE.sm} /> },
  { id: 'analysis', label: 'Analysis', icon: <BarChart3 size={ICON_SIZE.sm} /> },
];

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
  renderSidebar: (sidebar: React.ReactNode) => void;
  renderFooter: (footer: React.ReactNode | undefined) => void;
}

export function EnhanceStep({
  isEnhancing,
  title,
  description,
  figmaDesigns,
  scores,
  onTitleChange,
  onDescriptionChange,
  onBack,
  onCreate,
  renderSidebar,
  renderFooter,
}: Props) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<EnhanceTab>('general');
  const hasFigmaDesigns = figmaDesigns.length > 0;

  const visibleTabs = hasFigmaDesigns
    ? TAB_CONFIG
    : [TAB_CONFIG[0], TAB_CONFIG[2]];

  useEffect(() => {
    if (!isEnhancing && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isEnhancing]);

  useEffect(() => {
    if (isEnhancing) {
      renderSidebar(null);
      renderFooter(undefined);
      return;
    }

    renderSidebar(
      <ModalSidebar
        items={visibleTabs}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as EnhanceTab)}
      />,
    );

    const backButton = (
      <button onClick={onBack} className="btn-ghost">
        Back
      </button>
    );

    renderFooter(
      <ModalFooter back={backButton}>
        <SubmitButton onClick={onCreate} disabled={!description.trim()} label="Create" />
      </ModalFooter>,
    );
  }, [isEnhancing, activeTab, description, hasFigmaDesigns]);

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

  return (
    <>
      {activeTab === 'general' && (
        <div className="p-5 space-y-4">
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
            />
          </FormField>
        </div>
      )}

      {activeTab === 'designs' && (
        <div className="p-5">
          {hasFigmaDesigns ? (
            <FigmaDesignGrid designs={figmaDesigns} />
          ) : (
            <p className="text-caption-lg text-text-empty text-center py-6">
              No design files linked.
            </p>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="p-5 space-y-4">
          {scores?.clarityScore != null && scores?.riskScore != null ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ScoreBadge label="Clarity" score={scores.clarityScore} />
                </div>
                {scores.clarityReasoning && (
                  <FormField label="Clarity Analysis">
                    <TextArea value={scores.clarityReasoning} onChange={() => {}} disabled />
                  </FormField>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ScoreBadge label="Risk" score={scores.riskScore} invert />
                </div>
                {scores.riskReasoning && (
                  <FormField label="Risk Analysis">
                    <TextArea value={scores.riskReasoning} onChange={() => {}} disabled />
                  </FormField>
                )}
              </div>
            </>
          ) : (
            <p className="text-caption-lg text-text-empty text-center py-6">
              Analysis scores are being computed...
            </p>
          )}
        </div>
      )}
    </>
  );
}

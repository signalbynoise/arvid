import React, { useEffect, useRef } from 'react';
import { ArrowLeft, LoaderPinwheel } from 'lucide-react';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';

interface Props {
  isEnhancing: boolean;
  title: string;
  description: string;
  hasRepoContext: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBack: () => void;
  onCreate: () => void;
}

export function EnhanceStep({ isEnhancing, title, description, hasRepoContext, onTitleChange, onDescriptionChange, onBack, onCreate }: Props) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEnhancing && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isEnhancing]);

  if (isEnhancing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <LoaderPinwheel size={28} className="text-text-tertiary animate-spin" />
        <p className="text-caption-lg text-text-primary">Arvid is enhancing the requirement</p>
        <p className="text-caption text-text-quaternary">
          {hasRepoContext
            ? 'Generating specification using your codebase context...'
            : 'Generating title and structured specification...'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FormField label="Title">
        <TextInput
          value={title}
          onChange={onTitleChange}
          placeholder="Requirement title"
        />
      </FormField>

      <FormField label="Description">
        <TextArea
          value={description}
          onChange={onDescriptionChange}
          textareaRef={descriptionRef}
        />
        {hasRepoContext && (
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-frost-02 border border-border-default rounded-comfortable mt-2">
            <img src="/github.svg" alt="" className="w-3.5 h-3.5 shrink-0" />
            <span className="text-caption text-text-secondary">
              Enhanced with codebase context from your linked repository
            </span>
          </div>
        )}
      </FormField>

      <div className="flex justify-between items-center pt-6">
        <button onClick={onBack} className="btn-ghost flex items-center gap-1.5 -ml-2">
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button onClick={onCreate} disabled={!description.trim()} className="btn-primary">
          Create
        </button>
      </div>
    </div>
  );
}

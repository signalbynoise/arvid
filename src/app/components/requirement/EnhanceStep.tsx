import React, { useEffect, useRef } from 'react';
import { ArrowLeft, LoaderPinwheel } from 'lucide-react';

interface Props {
  isEnhancing: boolean;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBack: () => void;
  onCreate: () => void;
}

export function EnhanceStep({ isEnhancing, title, description, onTitleChange, onDescriptionChange, onBack, onCreate }: Props) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEnhancing && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isEnhancing]);

  if (isEnhancing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <LoaderPinwheel size={28} className="text-text-tertiary animate-spin" />
        <p className="text-[14px] font-[var(--fw-medium)] text-text-primary">Arvid is enhancing the requirement</p>
        <p className="text-[13px] text-text-quaternary">Generating title and structured specification...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Requirement title"
          className="w-full bg-surface-frost-02 border border-border-default rounded-comfortable px-3 py-2.5 text-[14px] font-[var(--fw-medium)] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-[var(--fw-medium)] text-text-tertiary uppercase tracking-widest">Description</label>
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full h-40 bg-surface-frost-02 border border-border-default rounded-card p-3 text-[14px] text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-border-focus focus:bg-surface-frost-04 transition-all resize-none"
        />
      </div>

      <div className="flex justify-between items-center pt-3">
        <button onClick={onBack} className="flex items-center space-x-1.5 px-3 py-2 text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors rounded-comfortable hover:bg-surface-frost-04 -ml-2">
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          onClick={onCreate}
          disabled={!description.trim()}
          className={`px-4 py-2 text-[13px] font-[var(--fw-medium)] rounded-comfortable transition-colors ${
            !description.trim() ? 'bg-surface-frost-05 text-text-quaternary cursor-not-allowed' : 'bg-white text-black hover:bg-btn-primary-hover'
          }`}
        >
          Create
        </button>
      </div>
    </div>
  );
}

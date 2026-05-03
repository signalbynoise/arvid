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
        <LoaderPinwheel size={28} className="text-[#8a8f98] animate-spin" />
        <p className="text-[14px] font-[510] text-[#f7f8f8]">Arvid is enhancing the requirement</p>
        <p className="text-[13px] text-[#62666d]">Generating title and structured specification...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Requirement title"
          className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[6px] px-3 py-2.5 text-[14px] font-[510] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-[510] text-[#8a8f98] uppercase tracking-widest">Description</label>
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full h-40 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-3 text-[14px] text-[#f7f8f8] placeholder:text-[#62666d] focus:outline-none focus:border-[rgba(255,255,255,0.2)] focus:bg-[rgba(255,255,255,0.04)] transition-all resize-none"
        />
      </div>

      <div className="flex justify-between items-center pt-3">
        <button onClick={onBack} className="flex items-center space-x-1.5 px-3 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors rounded-[6px] hover:bg-[rgba(255,255,255,0.04)] -ml-2">
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          onClick={onCreate}
          disabled={!description.trim()}
          className={`px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors ${
            !description.trim() ? 'bg-[rgba(255,255,255,0.05)] text-[#62666d] cursor-not-allowed' : 'bg-white text-black hover:bg-[#e0e0e0]'
          }`}
        >
          Create
        </button>
      </div>
    </div>
  );
}

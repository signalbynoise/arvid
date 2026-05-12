import React from 'react';
import { Image } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { FormField } from '../ui/FormField';

interface FigmaDesign {
  url: string;
  thumbnailUrl?: string;
  nodeName?: string;
}

interface Props {
  designs: FigmaDesign[];
}

export function FigmaDesignGrid({ designs }: Props) {
  if (designs.length === 0) return null;

  return (
    <FormField label="Figma Designs">
      <div className="flex flex-wrap gap-2 items-start">
        {designs.map((design, i) => (
          <a
            key={i}
            href={design.url}
            target="_blank"
            rel="noopener noreferrer"
            title={design.nodeName ?? design.url}
            className="block w-20 h-20 rounded-comfortable border border-border-default bg-surface-panel overflow-hidden hover:border-border-hover transition-colors"
          >
            {design.thumbnailUrl ? (
              <img
                src={design.thumbnailUrl}
                alt={design.nodeName ?? `Figma design ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center">
                <Image size={ICON_SIZE.md} className="text-text-quaternary" />
              </span>
            )}
          </a>
        ))}
      </div>
    </FormField>
  );
}

import React, { useCallback } from 'react';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { FIGMA_LINK_REGEX } from '../../../../shared/figmaUrl';

const MAX_FIGMA_LINKS = 4;

interface Props {
  links: string[];
  onChange: (links: string[]) => void;
}

export function FigmaLinksField({ links, onChange }: Props) {
  const handleChange = useCallback((index: number, value: string) => {
    const updated = [...links];
    updated[index] = value;
    onChange(updated);
  }, [links, onChange]);

  const activeCount = links.filter(Boolean).length;
  const showPlaceholder = activeCount < MAX_FIGMA_LINKS && links.length <= activeCount;
  const visibleCount = showPlaceholder ? links.length + 1 : links.length;

  const validationError = links.some(
    (link) => link.trim() && !FIGMA_LINK_REGEX.test(link.trim()),
  )
    ? 'Enter a valid Figma design URL'
    : null;

  return (
    <FormField label="Figma Links" error={validationError}>
      <div className="flex flex-col gap-2">
        {Array.from({ length: visibleCount }, (_, i) => {
          const isPlaceholder = i >= links.length;
          return (
            <div key={i} className={isPlaceholder ? 'opacity-50' : undefined}>
              <TextInput
                value={isPlaceholder ? '' : links[i]}
                onChange={(val) => {
                  if (isPlaceholder) {
                    onChange([...links, val]);
                  } else {
                    handleChange(i, val);
                  }
                }}
                placeholder="Paste the Figma link here"
                type="url"
              />
            </div>
          );
        })}
      </div>
    </FormField>
  );
}

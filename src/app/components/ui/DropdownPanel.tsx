import React from 'react';

type DropdownPanelVariant = 'floating' | 'attached';
type DropdownPanelPosition = 'above' | 'below';
type DropdownPanelAlign = 'start' | 'end';

const VARIANT_CLASSES: Record<DropdownPanelVariant, string> = {
  floating: 'border border-border-default rounded-comfortable shadow-elevated',
  attached: 'border-t border-l border-r border-border-default rounded-tl-comfortable rounded-tr-comfortable w-full',
};

const POSITION_CLASSES: Record<`${DropdownPanelVariant}-${DropdownPanelPosition}`, string> = {
  'floating-above': 'bottom-full mb-1',
  'floating-below': 'top-full mt-1',
  'attached-above': 'bottom-full',
  'attached-below': 'top-full',
};

const ALIGN_CLASSES: Record<DropdownPanelAlign, string> = {
  start: 'left-0',
  end: 'right-0',
};

interface DropdownPanelProps {
  variant?: DropdownPanelVariant;
  position?: DropdownPanelPosition;
  align?: DropdownPanelAlign;
  children: React.ReactNode;
}

export function DropdownPanel({
  variant = 'floating',
  position = 'below',
  align = 'start',
  children,
}: DropdownPanelProps) {
  const positionKey = `${variant}-${position}` as const;

  return (
    <div className={`absolute z-50 bg-surface-panel py-4 min-w-(--dropdown-min-w) max-h-(--dropdown-max-h) overflow-y-auto ${VARIANT_CLASSES[variant]} ${POSITION_CLASSES[positionKey]} ${ALIGN_CLASSES[align]}`}>
      {children}
    </div>
  );
}

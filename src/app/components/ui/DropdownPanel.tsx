import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type DropdownPanelVariant = 'floating' | 'attached';
type DropdownPanelPosition = 'above' | 'below' | 'right';
type DropdownPanelAlign = 'start' | 'end';

const VARIANT_CLASSES: Record<DropdownPanelVariant, string> = {
  floating: 'border border-border-default rounded-comfortable shadow-elevated',
  attached: 'border-t border-l border-r border-border-default rounded-tl-comfortable rounded-tr-comfortable w-full',
};

const POSITION_CLASSES: Record<`${DropdownPanelVariant}-${DropdownPanelPosition}`, string> = {
  'floating-above': 'bottom-full mb-1',
  'floating-below': 'top-full mt-1',
  'floating-right': 'left-full top-0 ml-1',
  'attached-above': 'bottom-full',
  'attached-below': 'top-full',
  'attached-right': 'left-full top-0 ml-1',
};

const ALIGN_CLASSES: Record<DropdownPanelAlign, string> = {
  start: 'left-0',
  end: 'right-0',
};

interface DropdownPanelProps {
  variant?: DropdownPanelVariant;
  position?: DropdownPanelPosition;
  align?: DropdownPanelAlign;
  anchorRef?: React.RefObject<HTMLElement | null>;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export function DropdownPanel({
  variant = 'floating',
  position = 'below',
  align = 'start',
  anchorRef,
  panelRef,
  children,
}: DropdownPanelProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    if (position === 'right') {
      setCoords({ top: rect.top, left: rect.right + 4 });
    } else if (position === 'above') {
      setCoords({ top: rect.top, left: align === 'end' ? rect.right : rect.left });
    } else {
      setCoords({ top: rect.bottom + 4, left: align === 'end' ? rect.right : rect.left });
    }
  }, [anchorRef, position, align]);

  if (anchorRef) {
    if (!coords) return null;

    const alignTransform = align === 'end' && position !== 'right' ? 'translateX(-100%)' : '';

    const panel = (
      <div
        ref={panelRef}
        className={`fixed z-[100] bg-surface-panel py-4 min-w-(--dropdown-min-w) max-h-(--dropdown-max-h) overflow-y-auto ${VARIANT_CLASSES[variant]}`}
        style={{ top: coords.top, left: coords.left, transform: alignTransform || undefined }}
      >
        {children}
      </div>
    );

    return createPortal(panel, document.body);
  }

  const positionKey = `${variant}-${position}` as const;
  const alignClass = position === 'right' ? '' : ALIGN_CLASSES[align];

  return (
    <div className={`absolute z-50 bg-surface-panel py-4 min-w-(--dropdown-min-w) max-h-(--dropdown-max-h) overflow-y-auto ${VARIANT_CLASSES[variant]} ${POSITION_CLASSES[positionKey]} ${alignClass}`}>
      {children}
    </div>
  );
}

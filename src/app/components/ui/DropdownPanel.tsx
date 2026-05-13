import React, { useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type Transition } from 'framer-motion';

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

const TRANSFORM_ORIGINS: Record<DropdownPanelPosition, Record<DropdownPanelAlign, string>> = {
  below: { start: 'top left', end: 'top right' },
  above: { start: 'bottom left', end: 'bottom right' },
  right: { start: 'top left', end: 'top left' },
};

const DEFAULT_TRANSITION: Transition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] };

interface DropdownPanelProps {
  isOpen: boolean;
  variant?: DropdownPanelVariant;
  position?: DropdownPanelPosition;
  align?: DropdownPanelAlign;
  anchorRef?: React.RefObject<HTMLElement | null>;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  transition?: Transition;
  children: React.ReactNode;
}

export function DropdownPanel({
  isOpen,
  variant = 'floating',
  position = 'below',
  align = 'start',
  anchorRef,
  panelRef,
  transition = DEFAULT_TRANSITION,
  children,
}: DropdownPanelProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [resolvedPosition, setResolvedPosition] = useState(position);
  const [resolvedAlign, setResolvedAlign] = useState(align);
  const transformOrigin = TRANSFORM_ORIGINS[resolvedPosition][resolvedAlign];

  const updatePosition = useCallback(() => {
    if (!anchorRef?.current || !isOpen) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelWidth = panelRef?.current?.offsetWidth ?? 200;
    const panelHeight = panelRef?.current?.offsetHeight ?? 200;

    let nextPosition = position;
    let nextAlign = align;
    let top: number;
    let left: number;

    if (position === 'right') {
      const fitsRight = rect.right + 4 + panelWidth <= vw;
      const fitsLeft = rect.left - 4 - panelWidth >= 0;
      if (!fitsRight && fitsLeft) {
        nextPosition = 'right';
        left = rect.left - 4 - panelWidth;
      } else {
        left = rect.right + 4;
      }
      top = rect.top;
      if (top + panelHeight > vh) {
        top = Math.max(8, vh - panelHeight - 8);
      }
    } else if (position === 'above') {
      top = rect.top;
      left = nextAlign === 'end' ? rect.right : rect.left;
    } else {
      const fitsBelow = rect.bottom + 4 + panelHeight <= vh;
      const fitsAbove = rect.top - 4 - panelHeight >= 0;
      if (!fitsBelow && fitsAbove) {
        nextPosition = 'above';
        top = rect.top - 4 - panelHeight;
      } else {
        top = rect.bottom + 4;
      }
      left = nextAlign === 'end' ? rect.right : rect.left;
      if (left + panelWidth > vw) {
        nextAlign = 'end';
        left = rect.right;
      }
    }

    setResolvedPosition(nextPosition);
    setResolvedAlign(nextAlign);
    setCoords({ top, left });
  }, [anchorRef, panelRef, position, align, isOpen]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useLayoutEffect(() => {
    if (!isOpen || !panelRef?.current) return;
    const observer = new ResizeObserver(() => updatePosition());
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [isOpen, panelRef, updatePosition]);

  if (anchorRef) {
    const alignTransform = resolvedAlign === 'end' && resolvedPosition !== 'right' ? 'translateX(-100%)' : '';

    const panel = (
      <AnimatePresence>
        {isOpen && coords && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={transition}
            className={`fixed z-[100] bg-surface-panel py-4 min-w-(--dropdown-min-w) max-h-(--dropdown-max-h) overflow-y-auto ${VARIANT_CLASSES[variant]}`}
            style={{ top: coords.top, left: coords.left, transform: alignTransform || undefined, transformOrigin }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );

    return createPortal(panel, document.body);
  }

  const positionKey = `${variant}-${position}` as const;
  const alignClass = position === 'right' ? '' : ALIGN_CLASSES[align];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={transition}
          style={{ transformOrigin }}
          className={`absolute z-50 bg-surface-panel py-4 min-w-(--dropdown-min-w) max-h-(--dropdown-max-h) overflow-y-auto ${VARIANT_CLASSES[variant]} ${POSITION_CLASSES[positionKey]} ${alignClass}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

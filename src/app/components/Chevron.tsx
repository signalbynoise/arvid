import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ChevronProps {
  open?: boolean;
  className?: string;
}

export function Chevron({ open = false, className }: ChevronProps) {
  return (
    <ChevronRight
      size={14}
      className={`text-text-quaternary shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''} ${className || ''}`}
    />
  );
}

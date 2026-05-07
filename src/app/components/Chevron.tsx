import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ChevronProps {
  open?: boolean;
  size?: number;
  className?: string;
}

export function Chevron({ open = false, size = 14, className }: ChevronProps) {
  return (
    <ChevronRight
      size={size}
      className={`text-text-quaternary shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''} ${className || ''}`}
    />
  );
}

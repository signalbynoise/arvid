import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface ChevronProps {
  open?: boolean;
  size?: number;
  className?: string;
}

export function Chevron({ open = false, size = 14, className }: ChevronProps) {
  return (
    <motion.span
      animate={{ rotate: open ? 90 : 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 17 }}
      className={`inline-flex items-center justify-center shrink-0 ${className || ''}`}
    >
      <ChevronRight size={size} className="text-text-quaternary" />
    </motion.span>
  );
}

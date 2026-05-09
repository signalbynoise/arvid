import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chevron } from '../Chevron';

const CONTENT_TRANSITION = { type: 'spring', stiffness: 150, damping: 22 };

interface SummarySectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SummarySection({ title, defaultOpen = false, children }: SummarySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-subtle last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center justify-between cursor-pointer py-2 text-label text-text-tertiary hover:text-text-secondary transition-colors outline-none"
      >
        <span>{title}</span>
        <Chevron open={isOpen} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={CONTENT_TRANSITION}
            className="overflow-hidden"
          >
            <div className="pb-3 pt-1 text-label text-text-primary">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

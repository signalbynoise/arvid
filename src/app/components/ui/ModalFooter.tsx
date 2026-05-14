import React from 'react';

interface ModalFooterProps {
  back?: React.ReactNode;
  children: React.ReactNode;
}

export function ModalFooter({ back, children }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-6 shrink-0">
      <div>{back}</div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

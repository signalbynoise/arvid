import React from 'react';

interface CardBodyProps {
  muted?: boolean;
  children: React.ReactNode;
}

export function CardBody({ muted = false, children }: CardBodyProps) {
  return (
    <div className={muted ? 'text-text-quaternary' : 'text-text-primary'}>
      {children}
    </div>
  );
}

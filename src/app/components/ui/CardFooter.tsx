import React from 'react';

interface CardFooterProps {
  meta: string;
  indicators?: React.ReactNode;
}

export function CardFooter({ meta, indicators }: CardFooterProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-label text-text-quaternary">{meta}</p>
      {indicators && (
        <div className="flex items-center gap-1.5">
          {indicators}
        </div>
      )}
    </div>
  );
}

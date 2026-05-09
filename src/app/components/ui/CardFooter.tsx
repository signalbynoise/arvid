import React from 'react';

interface CardFooterProps {
  meta: string;
  authorName?: string;
  assigneeCount?: number;
  indicators?: React.ReactNode;
}

export function CardFooter({ meta, authorName, assigneeCount, indicators }: CardFooterProps) {
  const displayMeta = authorName
    ? (assigneeCount && assigneeCount > 0 ? `${authorName} + ${assigneeCount}` : authorName)
    : meta;

  return (
    <div className="flex items-center justify-between">
      <p className="text-label text-text-quaternary">{displayMeta}</p>
      {indicators && (
        <div className="flex items-center gap-1.5">
          {indicators}
        </div>
      )}
    </div>
  );
}

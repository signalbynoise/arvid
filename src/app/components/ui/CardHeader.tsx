import React from 'react';

interface CardHeaderProps {
  shortId?: string;
  labels?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CardHeader({ shortId, labels, actions }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {shortId && (
          <span className="text-label font-mono text-text-quaternary">{shortId}</span>
        )}
        {labels}
      </div>
      {actions && (
        <div className="opacity-0 group-hover:opacity-100 transition-all">
          {actions}
        </div>
      )}
    </div>
  );
}

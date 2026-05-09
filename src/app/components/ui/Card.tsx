import React from 'react';

type CardVariant = 'default' | 'selected' | 'suggested' | 'inactive';

interface CardRootProps {
  id?: string;
  variant?: CardVariant;
  dimmed?: boolean;
  interactive?: boolean;
  connectorLeft?: boolean;
  connectorRight?: boolean;
  hint?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const BASE = 'relative flex flex-col gap-4 p-4 rounded-comfortable border overflow-hidden transition-all duration-200 text-caption-lg';

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'bg-surface-elevated border-border-default hover:border-border-hover',
  selected: 'bg-surface-elevated border-border-focus shadow-card-selected',
  suggested: 'bg-surface-frost-03 border-dashed border-border-strong opacity-70 hover:opacity-100',
  inactive: 'bg-surface-elevated border-border-default opacity-60 hover:opacity-100',
};

const DIMMED = 'opacity-30 saturate-50 hover:opacity-100 hover:saturate-100';

function CardRoot({
  id,
  variant = 'default',
  dimmed = false,
  interactive = false,
  connectorLeft = false,
  connectorRight = false,
  hint = false,
  onClick,
  children,
}: CardRootProps) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`${interactive ? 'group cursor-pointer' : ''} ${BASE} ${VARIANT_CLASSES[variant]} ${dimmed ? DIMMED : ''} ${hint ? 'card-hint' : ''}`}
    >
      {connectorLeft && (
        <div className="absolute top-1/2 -left-4 w-4 h-[1px] bg-border-focus z-10" />
      )}
      {connectorRight && (
        <div className="absolute top-1/2 -right-4 w-4 h-[1px] bg-border-focus z-10" />
      )}
      {children}
    </div>
  );
}

interface CardHeaderProps {
  shortId?: string;
  labels?: React.ReactNode;
  actions?: React.ReactNode;
}

function CardHeader({ shortId, labels, actions }: CardHeaderProps) {
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

interface CardBodyProps {
  muted?: boolean;
  children: React.ReactNode;
}

function CardBody({ muted = false, children }: CardBodyProps) {
  return (
    <div className={muted ? 'text-text-quaternary' : 'text-text-primary'}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  meta: string;
  authorName?: string;
  assigneeCount?: number;
  indicators?: React.ReactNode;
}

function CardFooter({ meta, authorName, assigneeCount, indicators }: CardFooterProps) {
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

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

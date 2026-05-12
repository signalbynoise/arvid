import React from 'react';

type ChipBorder = 'solid' | 'dashed' | 'gradient';
export type ChipAccent = 'default' | 'success' | 'warning' | 'error';

interface ChipProps {
  border?: ChipBorder;
  accent?: ChipAccent;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  gradientValue?: number;
  children: React.ReactNode;
}

const BASE = 'self-start flex items-center gap-2 text-label rounded-standard';
const INNER = 'px-2 py-1.5';
const HOVER = 'hover:border-border-focus hover:bg-surface-frost-05';

const ACCENT_BORDER: Record<ChipAccent, string> = {
  default: 'border-border-default',
  success: 'border-status-success',
  warning: 'border-status-warning',
  error: 'border-status-error',
};

export function Chip({ border = 'solid', accent = 'default', href, onClick, gradientValue, children }: ChipProps) {
  if (border === 'gradient' && gradientValue !== undefined) {
    const clamped = Math.max(0, Math.min(100, gradientValue));
    const color = clamped >= 80 ? 'var(--status-success)' : clamped >= 50 ? 'var(--status-warning)' : 'var(--status-error)';
    return (
      <div
        className={`${BASE} p-px`}
        style={{ background: `conic-gradient(${color} 0% ${clamped}%, var(--border-default) ${clamped}% 100%)` }}
      >
        <div className={`${INNER} bg-surface-elevated rounded-standard flex items-center gap-2`}>
          {children}
        </div>
      </div>
    );
  }

  const borderStyle = border === 'dashed' ? 'border border-dashed' : 'border';
  const classes = `${BASE} ${INNER} ${borderStyle} ${ACCENT_BORDER[accent]} transition-colors`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`${classes} ${HOVER} cursor-pointer`}
      >
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button onClick={(e) => { e.stopPropagation(); onClick(e); }} className={`${classes} ${HOVER} cursor-pointer`}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}

import React from 'react';
import { MiniColumnConnector } from './MiniColumnConnector';

type CardVariant = 'default' | 'suggested';
type ConnectorSide = 'left' | 'right';
type DimLevel = boolean | 'soft' | 'hard';

interface MiniCardProps {
  visible: boolean;
  emphasis?: boolean;
  dimmed?: DimLevel;
  variant?: CardVariant;
  connectors?: ConnectorSide[];
  children: React.ReactNode;
}

const SURFACE_CLASSES = {
  default: {
    emphasized: 'bg-surface-frost-03 border-border-default',
    normal: 'bg-surface-elevated border-border-default',
  },
  suggested: {
    emphasized: 'bg-surface-frost-03 border-border-strong border-dashed',
    normal: 'bg-surface-frost-03 border-border-strong border-dashed',
  },
} as const;

const DIM_CLASSES: Record<string, string> = {
  soft: 'opacity-60',
  hard: 'opacity-30 saturate-50',
};

function resolveDimClass(dimmed: DimLevel): string {
  if (dimmed === true) return DIM_CLASSES.hard;
  if (dimmed === false) return '';
  return DIM_CLASSES[dimmed] ?? '';
}

export function MiniCard({ visible, emphasis = false, dimmed = false, variant = 'default', connectors = [], children }: MiniCardProps) {
  const surface = SURFACE_CLASSES[variant][emphasis ? 'emphasized' : 'normal'];
  const visibilityClass = visible
    ? variant === 'suggested' ? 'opacity-70 translate-y-0' : 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-2';

  return (
    <div className={`relative flex flex-col gap-2 p-2 rounded-standard border overflow-hidden transition-all duration-500 ${visibilityClass} ${surface} ${resolveDimClass(dimmed)}`}>
      {connectors.map(side => (
        <MiniColumnConnector key={side} side={side} />
      ))}
      {children}
    </div>
  );
}

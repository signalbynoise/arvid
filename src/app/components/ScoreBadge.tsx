import React from 'react';

interface ScoreBadgeProps {
  label: string;
  score: number;
  invert?: boolean;
  separator?: string;
  title?: string;
}

function scoreColor(score: number, invert: boolean): string {
  const effective = invert ? 11 - score : score;
  if (effective >= 7) return 'bg-indicator-high text-indicator-high';
  if (effective >= 4) return 'bg-indicator-medium text-indicator-medium';
  return 'bg-indicator-low text-indicator-low';
}

function scoreBgColor(score: number, invert: boolean): string {
  const effective = invert ? 11 - score : score;
  if (effective >= 7) return 'bg-indicator-high/15';
  if (effective >= 4) return 'bg-indicator-medium/15';
  return 'bg-indicator-low/15';
}

export function ScoreBadge({ label, score, invert = false, separator = ':', title }: ScoreBadgeProps) {
  const dotColor = scoreColor(score, invert);
  const bgColor = scoreBgColor(score, invert);

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label ${bgColor}`}
      title={title}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor.split(' ')[0]}`} />
      <span className="text-text-primary">{label}{separator}{score}</span>
    </span>
  );
}

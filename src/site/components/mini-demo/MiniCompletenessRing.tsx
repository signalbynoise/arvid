const THRESHOLDS = { high: 80, medium: 50 } as const;

interface MiniCompletenessRingProps {
  value: number;
}

export function MiniCompletenessRing({ value }: MiniCompletenessRingProps) {
  const color = value >= THRESHOLDS.high ? 'var(--status-success)' : value >= THRESHOLDS.medium ? 'var(--status-warning)' : 'var(--status-error)';

  return (
    <div
      className="self-start flex items-center p-px rounded-micro"
      style={{ background: `conic-gradient(${color} 0% ${value}%, var(--border-default) ${value}% 100%)` }}
    >
      <div className="px-1.5 py-0.5 bg-surface-elevated rounded-micro flex items-center">
        <span className="text-[7px] font-[var(--fw-medium)] text-text-tertiary">{value}%</span>
      </div>
    </div>
  );
}

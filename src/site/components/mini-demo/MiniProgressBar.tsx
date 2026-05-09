const THRESHOLDS = { high: 80, medium: 50 } as const;

interface MiniProgressBarProps {
  value: number;
}

export function MiniProgressBar({ value }: MiniProgressBarProps) {
  const barColor = value >= THRESHOLDS.high ? 'bg-status-success' : value >= THRESHOLDS.medium ? 'bg-status-warning' : 'bg-status-error';

  return (
    <div className="w-full h-1 bg-surface-frost-10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${value}%` }} />
    </div>
  );
}

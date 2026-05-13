const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-status-success-surface text-status-success',
  open: 'bg-status-warning-surface text-status-warning',
  draft: 'bg-surface-frost-05 text-text-tertiary',
  void: 'bg-surface-frost-05 text-text-quaternary',
  uncollectible: 'bg-status-error-surface text-status-error',
};

interface InvoiceStatusBadgeProps {
  status: string | null;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const label = status ?? 'unknown';
  const style = STATUS_STYLES[label] ?? 'bg-surface-frost-05 text-text-tertiary';

  return (
    <span className={`px-2 py-0.5 rounded-pill text-label-sm ${style}`}>
      {label}
    </span>
  );
}

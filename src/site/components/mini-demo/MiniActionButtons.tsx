interface MiniActionButtonsProps {
  primaryLabel: string;
  secondaryLabel: string;
}

export function MiniActionButtons({ primaryLabel, secondaryLabel }: MiniActionButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <button className="flex-1 py-0.5 flex items-center justify-center bg-surface-frost-08 text-text-primary rounded-micro text-[7px] font-[var(--fw-medium)]">
        {primaryLabel}
      </button>
      <button className="flex-1 py-0.5 flex items-center justify-center bg-surface-frost-05 text-text-tertiary rounded-micro text-[7px] font-[var(--fw-medium)]">
        {secondaryLabel}
      </button>
    </div>
  );
}

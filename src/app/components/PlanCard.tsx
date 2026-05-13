interface PlanCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isCurrent: boolean;
}

export function PlanCard({ name, price, description, features, isCurrent }: PlanCardProps) {
  return (
    <div className={`rounded-panel border p-4 space-y-3 ${
      isCurrent
        ? 'border-accent-border bg-accent-surface-subtle'
        : 'border-border-subtle'
    }`}>
      <div className="flex items-center justify-between">
        <h4 className="text-caption-lg text-text-primary">{name}</h4>
        {isCurrent && (
          <span className="px-2 py-0.5 rounded-pill text-label-sm bg-accent-surface text-accent">
            Current
          </span>
        )}
      </div>
      <p className="text-caption text-text-primary">{price}</p>
      <p className="text-label-sm text-text-tertiary">{description}</p>
      <ul className="space-y-1.5">
        {features.map(feature => (
          <li key={feature} className="flex items-center gap-2 text-label-sm text-text-secondary">
            <span className="w-1 h-1 rounded-pill bg-text-quaternary shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

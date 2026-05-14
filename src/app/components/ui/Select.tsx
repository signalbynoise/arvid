interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}

export function Select({ value, onChange, options, disabled }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-surface-panel border border-border-default rounded-comfortable px-3 py-2 text-caption-lg text-text-primary focus:outline-none focus:border-border-focus appearance-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

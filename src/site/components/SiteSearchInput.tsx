interface SiteSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SiteSearchInput({ value, onChange, placeholder }: SiteSearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-transparent rounded-card bg-surface-panel p-6 text-caption-lg text-text-primary placeholder:text-text-empty outline-none focus:border-border-focus"
    />
  );
}

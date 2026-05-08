import React from 'react';

interface FormFieldProps {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}

export function FormField({ label, hint, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-text-quaternary">{label}</span>
      {children}
      {error && <span className="text-label-sm text-status-error">{error}</span>}
      {!error && hint && <span className="text-label-sm text-text-quaternary">{hint}</span>}
    </div>
  );
}

import React from 'react';

interface DropdownSectionProps {
  label?: string;
  children: React.ReactNode;
}

export function DropdownSection({ label, children }: DropdownSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-section text-text-quaternary px-3">
          {label}
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}

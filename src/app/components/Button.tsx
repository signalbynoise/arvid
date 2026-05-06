import React from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'destructive';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  subtle: 'btn-subtle',
  destructive: 'btn-destructive',
};

export function Button({ variant = 'ghost', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={`${VARIANT_CLASSES[variant]} px-4 py-1.5${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}

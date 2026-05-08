import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'url';
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const BASE_CLASSES =
  'w-full bg-surface-panel border rounded-comfortable p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:outline-none focus:border-border-focus transition-all';

const ERROR_BORDER = 'border-status-error-border-focus';
const DEFAULT_BORDER = 'border-border-default';
const DISABLED_CLASSES = 'opacity-50 cursor-not-allowed';

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError = false,
  disabled = false,
  autoFocus,
  autoComplete,
  inputRef,
  onKeyDown,
  onFocus,
  onBlur,
}: TextInputProps) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`${BASE_CLASSES} ${hasError ? ERROR_BORDER : DEFAULT_BORDER} ${disabled ? DISABLED_CLASSES : ''}`}
    />
  );
}

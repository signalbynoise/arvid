import React from 'react';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  className?: string;
}

const BASE_CLASSES =
  'w-full bg-surface-panel border rounded-comfortable p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:outline-none focus:border-border-focus transition-all resize-none min-h-textarea';

const ERROR_BORDER = 'border-status-error-border-focus';
const DEFAULT_BORDER = 'border-border-default';
const DISABLED_CLASSES = 'opacity-50 cursor-not-allowed';

export function TextArea({
  value,
  onChange,
  placeholder,
  hasError = false,
  disabled = false,
  autoFocus,
  textareaRef,
  className = '',
}: TextAreaProps) {
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`${BASE_CLASSES} ${hasError ? ERROR_BORDER : DEFAULT_BORDER} ${disabled ? DISABLED_CLASSES : ''} ${className}`}
    />
  );
}

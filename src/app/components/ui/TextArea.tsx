import React, { useRef, useLayoutEffect, useCallback } from 'react';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}

const BASE_CLASSES =
  'w-full bg-surface-panel border rounded-comfortable p-3 text-caption-lg text-text-primary placeholder:text-text-empty focus:outline-none focus:border-border-focus transition-all resize-none min-h-textarea overflow-hidden';

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
}: TextAreaProps) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(() => {
    const el = internalRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof textareaRef === 'function') textareaRef(node);
      else if (textareaRef && 'current' in textareaRef)
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    },
    [textareaRef],
  );

  return (
    <textarea
      ref={setRefs}
      value={value}
      onChange={(e) => { onChange(e.target.value); adjustHeight(); }}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`${BASE_CLASSES} ${hasError ? ERROR_BORDER : DEFAULT_BORDER} ${disabled ? DISABLED_CLASSES : ''}`}
    />
  );
}

import React from 'react';

interface KeyboardShortcutProps {
  chord: string;
}

export function KeyboardShortcut({ chord }: KeyboardShortcutProps) {
  return (
    <span className="flex items-center gap-1 shrink-0">
      {chord.split(' ').map((key, i) => (
        <kbd key={i} className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 bg-surface-frost-04 border border-border-default rounded-standard text-[11px] font-mono text-text-empty">
          {key}
        </kbd>
      ))}
    </span>
  );
}

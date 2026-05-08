import React from 'react';
import { Command } from 'cmdk';
import type { PaletteCommand } from './types';

interface CommandItemProps {
  command: PaletteCommand;
  onSelect: (command: PaletteCommand) => void;
}

export function CommandItem({ command, onSelect }: CommandItemProps) {
  const Icon = command.icon;

  return (
    <Command.Item
      value={command.id}
      onSelect={() => onSelect(command)}
      className="flex items-center gap-3 px-3 py-2 mx-1 rounded-comfortable text-[13px] font-[var(--fw-regular)] text-text-secondary cursor-pointer transition-colors data-[selected=true]:bg-surface-frost-08 data-[selected=true]:text-text-primary"
    >
      <Icon size={16} className="shrink-0 text-text-quaternary" />
      <span className="flex-1 truncate">{command.label}</span>
      {command.chord && (
        <span className="flex items-center gap-1 shrink-0">
          {command.chord.split(' ').map((key, i) => (
            <kbd key={i} className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 bg-surface-frost-04 border border-border-default rounded-standard text-[11px] font-mono text-text-empty">
              {key}
            </kbd>
          ))}
        </span>
      )}
    </Command.Item>
  );
}

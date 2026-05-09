import React from 'react';
import { Command } from 'cmdk';
import type { PaletteCommand } from './types';
import { KeyboardShortcut } from '../ui/KeyboardShortcut';

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
      {command.chord && <KeyboardShortcut chord={command.chord} />}
    </Command.Item>
  );
}

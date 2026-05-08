import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Command } from 'cmdk';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useStore, selectCommandPaletteOpen } from '../../store';
import { useCommands } from './useCommands';
import { useGlobalShortcuts, isEditableTarget } from './useGlobalShortcuts';
import { CommandItem } from './CommandItem';
import { logger } from '../../logger';
import type { PaletteCommand, CommandCategory } from './types';

const log = logger.create('command-palette');

const CATEGORY_ORDER: CommandCategory[] = ['Create', 'Edit', 'Navigation', 'Integrations'];

export function CommandPalette() {
  const open = useStore(selectCommandPaletteOpen);
  const openPalette = useStore(s => s.openCommandPalette);
  const closePalette = useStore(s => s.closeCommandPalette);
  const togglePalette = useStore(s => s.toggleCommandPalette);

  useGlobalShortcuts();

  const commands = useCommands();
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fuseRef = useRef<Fuse<PaletteCommand> | null>(null);
  useEffect(() => {
    fuseRef.current = new Fuse(commands, {
      keys: ['label', 'keywords', 'chord'],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [commands]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();

        if (open) {
          inputRef.current?.focus();
        } else {
          if (isEditableTarget(e.target)) return;
          openPalette();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, openPalette, togglePalette]);

  useEffect(() => {
    if (open) {
      setSearch('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filterFn = useCallback(
    (value: string, searchTerm: string): number => {
      if (!searchTerm) return 1;
      if (!fuseRef.current) return 0;

      const cmd = commands.find(c => c.id === value);
      if (!cmd) return 0;

      const results = fuseRef.current.search(searchTerm);
      const match = results.find(r => r.item.id === value);
      return match ? 1 - (match.score ?? 0) : 0;
    },
    [commands],
  );

  const handleSelect = useCallback(
    async (command: PaletteCommand) => {
      log.info('execute', 'Executing command', { id: command.id, label: command.label });
      try {
        await command.action();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Command failed';
        log.error('execute', 'Command failed', { id: command.id, error: message });
        toast.error(message);
      }
    },
    [],
  );

  const groupedCommands = CATEGORY_ORDER
    .map(category => ({
      category,
      items: commands.filter(c => c.category === category),
    }))
    .filter(g => g.items.length > 0);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-overlay-scrim backdrop-blur-sm animate-in fade-in duration-150"
        onClick={closePalette}
      />

      <Command
        filter={filterFn}
        className="relative w-full max-w-[480px] bg-surface-elevated border border-border-subtle rounded-panel shadow-modal overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            closePalette();
          }
        }}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border-subtle">
          <Search size={16} className="shrink-0 text-text-quaternary" />
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command..."
            className="flex-1 h-12 bg-transparent text-[14px] font-[var(--fw-regular)] text-text-primary placeholder:text-text-quaternary outline-none"
          />
        </div>

        <Command.List className="max-h-[320px] overflow-y-auto py-2 hide-scrollbar">
          <Command.Empty className="py-8 text-center text-[13px] text-text-quaternary">
            No results found.
          </Command.Empty>

          {groupedCommands.map(({ category, items }) => (
            <Command.Group
              key={category}
              heading={category}
              className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-[var(--fw-medium)] [&_[cmdk-group-heading]]:text-text-quaternary [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
            >
              {items.map(command => (
                <CommandItem
                  key={command.id}
                  command={command}
                  onSelect={handleSelect}
                />
              ))}
            </Command.Group>
          ))}
        </Command.List>

      </Command>
    </div>,
    document.body,
  );
}

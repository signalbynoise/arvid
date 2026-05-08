import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { logger } from '../../logger';
import { useCommands } from './useCommands';
import type { PaletteCommand, ContextKey } from './types';

const log = logger.create('shortcuts');

const CHORD_TIMEOUT_MS = 1000;

const LEADER_KEYS = new Set(['c', 'g', 'e', 'd']);

interface ChordState {
  keys: string[];
  timestamp: number;
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
  return false;
}

function hasModifiers(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey;
}

function hasContext(contextRequired: ContextKey[] | undefined): boolean {
  if (!contextRequired?.length) return true;
  const state = useStore.getState();
  return contextRequired.every(key => (state as Record<string, unknown>)[key] != null);
}

function buildChordString(keys: string[]): string {
  return keys.join(' ').toUpperCase();
}

function findExactMatch(commands: PaletteCommand[], keys: string[]): PaletteCommand | undefined {
  const chordStr = buildChordString(keys);
  return commands.find(cmd => cmd.chord?.toUpperCase() === chordStr);
}

function hasPrefixMatch(commands: PaletteCommand[], keys: string[]): boolean {
  const prefix = buildChordString(keys);
  return commands.some(cmd => {
    const chord = cmd.chord?.toUpperCase();
    return chord && chord.startsWith(prefix) && chord !== prefix;
  });
}

export function useGlobalShortcuts() {
  const commands = useCommands();
  const commandPaletteOpen = useStore(s => s.commandPaletteOpen);
  const openCommandPalette = useStore(s => s.openCommandPalette);

  const stateRef = useRef<ChordState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetChord = useCallback(() => {
    stateRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      log.debug('chord', 'Chord timed out', { keys: stateRef.current?.keys });
      stateRef.current = null;
    }, CHORD_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commandPaletteOpen) return;
      if (isEditableTarget(e.target)) return;
      if (hasModifiers(e)) return;

      const key = e.key.toLowerCase();

      if (key === 'escape') {
        if (stateRef.current) {
          resetChord();
          log.debug('chord', 'Chord cancelled via Escape');
        }
        return;
      }

      if (key.length !== 1 || !/[a-z]/.test(key)) return;

      const current = stateRef.current;

      if (!current) {
        if (!LEADER_KEYS.has(key)) return;

        e.preventDefault();
        stateRef.current = { keys: [key], timestamp: Date.now() };
        startTimeout();
        log.debug('chord', 'Leader key pressed', { key });
        return;
      }

      e.preventDefault();

      const elapsed = Date.now() - current.timestamp;
      if (elapsed > CHORD_TIMEOUT_MS) {
        resetChord();
        log.debug('chord', 'Chord expired');
        return;
      }

      const nextKeys = [...current.keys, key];

      const exactMatch = findExactMatch(commands, nextKeys);
      if (exactMatch) {
        resetChord();

        if (!hasContext(exactMatch.contextRequired)) {
          log.debug('chord', 'Context missing, opening palette', {
            command: exactMatch.id,
            contextRequired: exactMatch.contextRequired,
          });
          openCommandPalette();
          return;
        }

        log.debug('chord', 'Executing command', { command: exactMatch.id, chord: buildChordString(nextKeys) });
        exactMatch.action();
        return;
      }

      if (hasPrefixMatch(commands, nextKeys)) {
        stateRef.current = { keys: nextKeys, timestamp: current.timestamp };
        startTimeout();
        log.debug('chord', 'Awaiting next key', { keys: nextKeys });
        return;
      }

      resetChord();
      log.debug('chord', 'No command matched', { chord: buildChordString(nextKeys) });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [commands, commandPaletteOpen, openCommandPalette, resetChord, startTimeout]);
}

export { isEditableTarget };

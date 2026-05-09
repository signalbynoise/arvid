import { useState, useEffect, useRef, useCallback } from 'react';
import type { Step, CursorPosition } from './types';

interface SequenceState {
  has: (action: string) => boolean;
  index: number;
  cursors: Map<string, CursorPosition>;
}

function collectLeadingInstantSteps(steps: Step[]): Set<string> {
  const set = new Set<string>();
  for (const step of steps) {
    if (step.delay > 0 || step.action === 'reset') break;
    set.add(step.action);
  }
  return set;
}

function collectLeadingInstantCursors(steps: Step[]): Map<string, CursorPosition> {
  const map = new Map<string, CursorPosition>();
  for (const step of steps) {
    if (step.delay > 0 || step.action === 'reset') break;
    if (step.cursors) {
      for (const c of step.cursors) map.set(c.id, c);
    }
  }
  return map;
}

function findFirstNonInstantIndex(steps: Step[]): number {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].delay > 0 || steps[i].action === 'reset') return i;
  }
  return steps.length;
}

function mergeCursors(prev: Map<string, CursorPosition>, incoming?: CursorPosition[]): Map<string, CursorPosition> {
  if (!incoming || incoming.length === 0) return prev;
  const next = new Map(prev);
  for (const c of incoming) {
    if (c.visible === false) {
      next.delete(c.id);
    } else {
      next.set(c.id, c);
    }
  }
  return next;
}

export function useSequence(steps: Step[], containerRef?: React.RefObject<HTMLElement | null>): SequenceState {
  const [active, setActive] = useState<Set<string>>(() => collectLeadingInstantSteps(steps));
  const [currentIndex, setCurrentIndex] = useState(() => findFirstNonInstantIndex(steps));
  const [cursorMap, setCursorMap] = useState<Map<string, CursorPosition>>(() => collectLeadingInstantCursors(steps));
  const indexRef = useRef(findFirstNonInstantIndex(steps));
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(false);
  const advanceRef = useRef<() => void>();

  const pause = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    advanceRef.current?.();
  }, []);

  useEffect(() => {
    function advance() {
      if (pausedRef.current) return;
      const step = steps[indexRef.current];
      if (!step) return;

      timerRef.current = setTimeout(() => {
        if (pausedRef.current) return;

        if (step.action === 'reset') {
          const seed = collectLeadingInstantSteps(steps);
          const seedCursors = collectLeadingInstantCursors(steps);
          const startIdx = findFirstNonInstantIndex(steps);
          setActive(seed);
          setCursorMap(seedCursors);
          setCurrentIndex(startIdx);
          indexRef.current = startIdx;
        } else {
          if (step.action !== 'noop') {
            setActive(prev => new Set(prev).add(step.action));
          }
          if (step.cursors) {
            setCursorMap(prev => mergeCursors(prev, step.cursors));
          }
          indexRef.current += 1;
          setCurrentIndex(indexRef.current);
        }
        advance();
      }, step.delay);
    }

    advanceRef.current = advance;

    const seed = collectLeadingInstantSteps(steps);
    const seedCursors = collectLeadingInstantCursors(steps);
    const startIdx = findFirstNonInstantIndex(steps);
    indexRef.current = startIdx;
    pausedRef.current = false;
    setActive(seed);
    setCursorMap(seedCursors);
    setCurrentIndex(startIdx);
    advance();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [steps]);

  useEffect(() => {
    if (!containerRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          resume();
        } else {
          pause();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, pause, resume]);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pause, resume]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    const finalSet = new Set<string>();
    const finalCursors = new Map<string, CursorPosition>();
    for (const step of steps) {
      if (step.action === 'reset') break;
      finalSet.add(step.action);
      if (step.cursors) {
        for (const c of step.cursors) {
          if (c.visible === false) finalCursors.delete(c.id);
          else finalCursors.set(c.id, c);
        }
      }
    }
    setActive(finalSet);
    setCursorMap(finalCursors);
    setCurrentIndex(steps.length - 1);
  }, [steps]);

  return {
    has: (action: string) => active.has(action),
    index: currentIndex,
    cursors: cursorMap,
  };
}

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DmcDirection, DmcTransition, DmcEngineOutput } from './dmc-types';

const DEFAULT_TICK_DELAY = 1000;
const DEFAULT_TICK_JITTER = 400;
const DEFAULT_START_DELAY = 2000;

function weightedPick<T extends { weight?: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const item of items) {
    rand -= item.weight ?? 1;
    if (rand <= 0) return item;
  }
  return items[items.length - 1];
}

function jitteredDelay(base: number, jitter: number): number {
  return base + Math.floor((Math.random() * 2 - 1) * jitter);
}

export function useDmcEngine<S, P = unknown>(
  direction: DmcDirection<S, P>,
  containerRef?: React.RefObject<HTMLElement | null>,
): DmcEngineOutput<S> {
  const tickDelay = direction.tickDelay ?? DEFAULT_TICK_DELAY;
  const tickJitter = direction.tickJitter ?? DEFAULT_TICK_JITTER;
  const startDelay = direction.startDelay ?? DEFAULT_START_DELAY;

  const [state, setState] = useState<S>(() => direction.initialState);
  const [currentTransition, setCurrentTransition] = useState<DmcTransition<S> | null>(null);
  const [activeActor, setActiveActor] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pausedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    tick();
  }, []);

  function pickNextTransition(current: S): DmcTransition<S> | null {
    const eligible = direction.rules.filter(rule => rule.canExecute(current));
    if (eligible.length === 0) return null;
    const picked = weightedPick(eligible);
    return picked.execute(current, direction.contentPool);
  }

  function tick() {
    if (pausedRef.current) return;

    timerRef.current = setTimeout(() => {
      if (pausedRef.current) return;

      const current = stateRef.current;

      if (direction.goal(current)) {
        const next = direction.resetCycle(current);
        setState(next);
        stateRef.current = next;
        setCurrentTransition(null);
        setActiveActor(null);
        tick();
        return;
      }

      const transition = pickNextTransition(current);
      if (!transition) {
        tick();
        return;
      }

      setActiveActor(transition.actor);
      setCurrentTransition(transition);

      timerRef.current = setTimeout(() => {
        if (pausedRef.current) return;

        const next = transition.stateUpdate(stateRef.current);
        setState(next);
        stateRef.current = next;

        tick();
      }, jitteredDelay(tickDelay, tickJitter));
    }, jitteredDelay(tickDelay, tickJitter));
  }

  useEffect(() => {
    pausedRef.current = false;
    const offset = Math.floor(Math.random() * startDelay);
    timerRef.current = setTimeout(() => {
      tick();
    }, offset);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [direction]);

  useEffect(() => {
    if (!containerRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) resume();
        else pause();
      },
      { threshold: 0.3 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef, pause, resume]);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) pause();
      else resume();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pause, resume]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mq.matches) return;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { state, currentTransition, activeActor };
}

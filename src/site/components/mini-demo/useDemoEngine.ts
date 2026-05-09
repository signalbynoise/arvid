import { useState, useEffect, useRef, useCallback } from 'react';
import type { DemoState, Direction, Transition, EngineOutput } from './types';

const DEFAULT_STATE: DemoState = {
  requirements: [],
  selectedRequirement: null,
  questions: {},
  acceptedQuestions: [],
  selectedQuestion: null,
  answers: {},
  summaryGenerated: false,
  completeness: 0,
  modalPhase: null,
  exports: [],
  browsed: false,
  imported: false,
  cycleCount: 0,
};

const TICK_DELAY = 1000;

function weightedPick<T extends { weight?: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const item of items) {
    rand -= item.weight ?? 1;
    if (rand <= 0) return item;
  }
  return items[items.length - 1];
}

function pickNextTransition(direction: Direction, state: DemoState): Transition | null {
  const eligible = direction.rules.filter(rule => rule.canExecute(state));
  if (eligible.length === 0) return null;
  const picked = weightedPick(eligible);
  return picked.execute(state, direction.contentPool);
}

function startNewCycle(state: DemoState): DemoState {
  return {
    ...state,
    selectedRequirement: null,
    selectedQuestion: null,
    questions: {},
    acceptedQuestions: [],
    answers: {},
    summaryGenerated: false,
    completeness: 0,
    modalPhase: null,
    exports: [],
    browsed: true,
    imported: true,
    cycleCount: state.cycleCount + 1,
  };
}

export function useDemoEngine(
  direction: Direction,
  containerRef?: React.RefObject<HTMLElement | null>,
): EngineOutput {
  const [state, setState] = useState<DemoState>(() => ({
    ...DEFAULT_STATE,
    ...direction.initialState,
  }));
  const [currentTransition, setCurrentTransition] = useState<Transition | null>(null);
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

  function tick() {
    if (pausedRef.current) return;

    timerRef.current = setTimeout(() => {
      if (pausedRef.current) return;

      const current = stateRef.current;

      if (direction.goal(current)) {
        const next = startNewCycle(current);
        setState(next);
        stateRef.current = next;
        setCurrentTransition(null);
        setActiveActor(null);
        tick();
        return;
      }

      const transition = pickNextTransition(direction, current);
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
      }, TICK_DELAY);
    }, TICK_DELAY);
  }

  useEffect(() => {
    pausedRef.current = false;
    tick();
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

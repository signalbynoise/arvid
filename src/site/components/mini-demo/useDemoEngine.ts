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
  cycleCount: 0,
};

const TICK_DELAY = 1000;

function pickNextTransition(direction: Direction, state: DemoState): Transition | null {
  for (const rule of direction.rules) {
    if (rule.canExecute(state)) {
      return rule.execute(state, direction.contentPool);
    }
  }
  return null;
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
    browsed: false,
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

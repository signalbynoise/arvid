import { useState, useEffect, useRef } from 'react';
import type { Step } from './types';

export function useSequence(steps: Step[]) {
  const [active, setActive] = useState<Set<string>>(new Set());
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function advance() {
      const step = steps[indexRef.current];
      if (!step) return;

      timerRef.current = setTimeout(() => {
        if (step.action === 'reset') {
          setActive(new Set());
          indexRef.current = 0;
        } else {
          setActive(prev => new Set(prev).add(step.action));
          indexRef.current += 1;
        }
        advance();
      }, step.delay);
    }

    indexRef.current = 0;
    setActive(new Set());
    advance();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [steps]);

  return active;
}

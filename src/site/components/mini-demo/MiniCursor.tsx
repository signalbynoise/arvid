import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniCursorProps {
  name: string;
  target: string;
  visible: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
}

const SPRING = { stiffness: 60, damping: 18, mass: 1.2 };

function resolveTargetPosition(target: string, container: HTMLElement | null): { x: number; y: number } | null {
  if (!container) return null;
  const el = container.querySelector(`[data-cursor-target="${target}"]`);
  if (!el) return null;
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    x: elRect.left - containerRect.left + 4,
    y: elRect.top - containerRect.top + 4,
  };
}

export function MiniCursor({ name, target, visible, containerRef }: MiniCursorProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const updatePos = useCallback(() => {
    const resolved = resolveTargetPosition(target, containerRef.current);
    if (resolved) setPos(resolved);
  }, [target, containerRef]);

  useEffect(() => {
    updatePos();
    const frame = requestAnimationFrame(updatePos);
    return () => cancelAnimationFrame(frame);
  }, [updatePos]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={name}
          className="absolute pointer-events-none"
          style={{ zIndex: 50 }}
          initial={{ x: pos.x, y: pos.y, opacity: 0, scale: 0.5 }}
          animate={{ x: pos.x, y: pos.y, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ x: SPRING, y: SPRING, opacity: { duration: 0.5 }, scale: { duration: 0.3 } }}
        >
          <svg width="15" height="20" viewBox="0 0 16 22" fill="none" className="drop-shadow-md">
            <path
              d="M1.2 0.4L14.8 10.8C15.4 11.2 15.2 12.1 14.4 12.1H8.3C8.1 12.1 7.9 12.2 7.7 12.3L2.8 16.8C2.3 17.3 1.4 17.0 1.2 16.3V0.4Z"
              fill="white"
            />
            <path
              d="M1.2 0.4L14.8 10.8C15.4 11.2 15.2 12.1 14.4 12.1H8.3C8.1 12.1 7.9 12.2 7.7 12.3L2.8 16.8C2.3 17.3 1.4 17.0 1.2 16.3V0.4Z"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="0.8"
            />
          </svg>

          <div className="absolute top-[16px] left-[10px] px-2.5 py-1 rounded-pill bg-white text-[8px] font-[var(--fw-medium)] text-surface-base whitespace-nowrap shadow-elevated">
            {name}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

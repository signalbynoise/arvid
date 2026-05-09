import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

interface MiniCursorProps {
  name: string;
  target: string;
  visible: boolean;
  boundaryId?: string;
}

const SPRING = { stiffness: 60, damping: 18, mass: 1.2 };

export function MiniCursor({ name, target, visible, boundaryId }: MiniCursorProps) {
  const [inBounds, setInBounds] = useState(true);
  const [hasPos, setHasPos] = useState(false);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const rafRef = useRef<number>(0);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!visible || !target) {
      setHasPos(false);
      return;
    }

    function poll() {
      const el = document.querySelector(`[data-cursor-target="${targetRef.current}"]`);

      if (boundaryId) {
        const boundary = document.querySelector(`[data-cursor-boundary="${boundaryId}"]`);
        if (boundary) {
          const bRect = boundary.getBoundingClientRect();
          if (el) {
            const eRect = el.getBoundingClientRect();
            const cx = eRect.left + eRect.width / 2;
            const cy = eRect.top + eRect.height / 2;
            const inside = cx >= bRect.left && cx <= bRect.right && cy >= bRect.top && cy <= bRect.bottom;
            setInBounds(inside);
          } else {
            setInBounds(false);
          }
        }
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        mvX.set(rect.left + rect.width / 2);
        mvY.set(rect.top + rect.height / 2);
        setHasPos(true);
      }

      rafRef.current = requestAnimationFrame(poll);
    }

    poll();
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, visible, boundaryId, mvX, mvY]);

  const isVisible = visible && hasPos && inBounds;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={name}
          className="pointer-events-none"
          style={{ position: 'fixed', zIndex: 9999, left: 0, top: 0, x: mvX, y: mvY }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.3 } }}
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

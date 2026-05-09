import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniCursorProps {
  name: string;
  target: string;
  visible: boolean;
  boundaryId?: string;
}

const SPRING = { stiffness: 60, damping: 18, mass: 1.2 };

export function MiniCursor({ name, target, visible, boundaryId }: MiniCursorProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [inBounds, setInBounds] = useState(true);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!visible || !target) return;

    let attempts = 0;

    function poll() {
      const el = document.querySelector(`[data-cursor-target="${target}"]`);
      if (!el) {
        if (attempts++ < 120) rafRef.current = requestAnimationFrame(poll);
        return;
      }

      const rect = el.getBoundingClientRect();
      const newX = rect.left + rect.width / 2;
      const newY = rect.top + rect.height / 2;

      if (boundaryId) {
        const boundary = document.querySelector(`[data-cursor-boundary="${boundaryId}"]`);
        if (boundary) {
          const bRect = boundary.getBoundingClientRect();
          const inside = newX >= bRect.left && newX <= bRect.right && newY >= bRect.top && newY <= bRect.bottom;
          setInBounds(inside);
        }
      }

      setPos(prev => {
        if (!prev || Math.abs(prev.x - newX) > 2 || Math.abs(prev.y - newY) > 2) {
          return { x: newX, y: newY };
        }
        return prev;
      });

      rafRef.current = requestAnimationFrame(poll);
    }

    poll();
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, visible, boundaryId]);

  const isVisible = visible && !!pos && inBounds;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={name}
          className="pointer-events-none"
          style={{ position: 'fixed', zIndex: 9999, left: 0, top: 0 }}
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

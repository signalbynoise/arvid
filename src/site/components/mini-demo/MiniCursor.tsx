import { motion, AnimatePresence } from 'framer-motion';

interface MiniCursorProps {
  name: string;
  x: string;
  y: string;
  visible: boolean;
}

const SPRING = { stiffness: 60, damping: 18, mass: 1.2 };

export function MiniCursor({ name, x, y, visible }: MiniCursorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={name}
          className="absolute pointer-events-none"
          style={{ zIndex: 50, left: x, top: y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ layout: SPRING, opacity: { duration: 0.5 }, scale: { duration: 0.3 } }}
          layout
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

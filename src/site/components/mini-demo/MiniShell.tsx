import React from 'react';

/**
 * CRITICAL ARCHITECTURE RULE — TWO-DIV STRUCTURE
 *
 * MiniShell uses a two-div structure to solve a CSS position conflict:
 *
 *   Outer div  — receives `className` from the demo layout config (e.g.
 *                `absolute w-[800px] h-[600px] top-[40px] right-0`).
 *                This div MUST NOT have `position: relative` because demo
 *                configs set `position: absolute` via className. In Tailwind v4,
 *                when two utilities target the same CSS property on the same
 *                element, the one generated later in the stylesheet wins — NOT
 *                the one listed later in the class attribute. If `relative` and
 *                `absolute` coexist, `relative` can silently win, breaking all
 *                demo positioning (hero won't anchor to bottom, side demos
 *                won't anchor left/right). This was a multi-hour debugging
 *                nightmare — do not repeat it.
 *
 *   Inner div  — `relative flex flex-1 min-w-0 min-h-0`. This provides the
 *                positioning context that MiniModal needs for its
 *                `absolute inset-0` overlay scrim, scoping the dark backdrop
 *                to the app shell only (not the full page container).
 *
 * NEVER add `relative` to the outer div. NEVER remove the inner div.
 * If you need a new positioning context, add it inside the inner div.
 */

interface MiniShellProps {
  visible: boolean;
  className?: string;
  shadow?: boolean;
  roundedRight?: boolean;
  roundedBottom?: boolean;
  children: React.ReactNode;
}

export function MiniShell({ visible, className, shadow = true, roundedRight = true, roundedBottom = true, children }: MiniShellProps) {
  let radiusClass: string;
  if (!roundedBottom) {
    radiusClass = roundedRight ? 'rounded-t-standard rounded-b-none' : 'rounded-tl-standard rounded-tr-none rounded-b-none';
  } else {
    radiusClass = roundedRight ? 'rounded-standard' : 'rounded-l-standard rounded-r-none';
  }

  return (
    <div className={`flex ${radiusClass} overflow-hidden border border-border-subtle bg-surface-base ${shadow ? 'shadow-elevated' : ''} transition-all duration-700 ${
      visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    } ${className ?? 'w-full h-full'}`}>
      <div className="relative flex flex-1 min-w-0 min-h-0">
        {children}
      </div>
    </div>
  );
}

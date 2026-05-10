import React, { useState, useRef, useEffect } from 'react';

interface NavDropdownItem {
  label: string;
  href: string;
}

interface NavDropdownProps {
  trigger: string;
  items: NavDropdownItem[];
}

export function NavDropdown({ trigger, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-caption-lg text-text-primary transition-colors hover:text-text-secondary"
      >
        {trigger}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 flex min-w-dropdown flex-col gap-3 rounded-comfortable bg-surface-panel px-4 py-5 shadow-elevated">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-caption-lg text-text-primary transition-colors hover:text-text-secondary"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

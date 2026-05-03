import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Docs', href: '#docs' },
];

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface-panel/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <a href="/" className="flex items-center">
          <img src="/logo_wide.svg" alt="Arvid" className="h-5" />
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-[13px] font-[var(--fw-medium)] text-text-secondary transition-colors hover:text-text-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href={`${APP_URL}/login`}
            className="flex h-8 items-center rounded-comfortable border border-border-default bg-surface-frost-02 px-3 text-[13px] font-[var(--fw-medium)] text-text-secondary transition-colors hover:bg-surface-frost-05 hover:text-text-primary"
          >
            Sign in
          </a>
          <a
            href={`${APP_URL}/login`}
            className="flex h-8 items-center rounded-comfortable bg-accent-brand px-4 text-[13px] font-[var(--fw-medium)] text-white transition-colors hover:bg-accent-hover"
          >
            Get started
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-1.5 text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border-subtle bg-surface-panel px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-[15px] font-[var(--fw-medium)] text-text-secondary transition-colors hover:text-text-primary"
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2 border-t border-border-subtle">
            <a
              href={`${APP_URL}/login`}
              className="flex h-10 items-center justify-center rounded-comfortable border border-border-default bg-surface-frost-02 text-[14px] font-[var(--fw-medium)] text-text-secondary"
            >
              Sign in
            </a>
            <a
              href={`${APP_URL}/login`}
              className="flex h-10 items-center justify-center rounded-comfortable bg-accent-brand text-[14px] font-[var(--fw-medium)] text-white"
            >
              Get started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

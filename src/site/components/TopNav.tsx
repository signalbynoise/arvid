import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageGrid } from './PageGrid';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Enterprise', href: '#enterprise' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#resources' },
];

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PageGrid as="header" className="w-full pt-6">
      <div className="col-span-full flex items-center justify-between">
        <a href="/" className="flex items-center shrink-0">
          <img src="/logo_wide.svg" alt="Arvid" className="h-6" />
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-[14px] font-[var(--fw-medium)] text-text-primary transition-colors hover:text-text-secondary"
            >
              {label}
            </a>
          ))}
        </nav>

        <a
          href={`${APP_URL}/login`}
          className="hidden md:flex h-[36px] items-center rounded-pill bg-btn-primary px-4 text-[12px] font-[var(--fw-medium)] text-text-on-primary transition-colors hover:bg-btn-primary-hover"
        >
          Open App
        </a>

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
        <div className="col-span-full md:hidden mt-6 flex flex-col gap-4 border-t border-border-subtle pt-4">
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
          <a
            href={`${APP_URL}/login`}
            className="flex h-10 items-center justify-center rounded-pill bg-btn-primary text-[14px] font-[var(--fw-medium)] text-text-on-primary"
          >
            Open App
          </a>
        </div>
      )}
    </PageGrid>
  );
}

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { PageGrid } from './PageGrid';
import { NavDropdown } from './NavDropdown';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

const RESOURCES_ITEMS = [
  { label: 'Articles', href: '/articles' },
  { label: 'Features', href: '#features' },
  { label: 'Docs', href: '#docs' },
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
              className="text-caption-lg text-text-primary transition-colors hover:text-text-secondary"
            >
              {label}
            </a>
          ))}
          <NavDropdown trigger="Resources" items={RESOURCES_ITEMS} />
        </nav>

        <a
          href={`${APP_URL}/login`}
          className="hidden md:flex h-9 items-center rounded-pill bg-btn-primary px-4 text-btn text-text-on-primary transition-colors hover:bg-btn-primary-hover"
        >
          Open App
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-1.5 text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={ICON_SIZE.lg} /> : <Menu size={ICON_SIZE.lg} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="col-span-full md:hidden mt-6 flex flex-col gap-4 border-t border-border-subtle pt-4">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm-md text-text-secondary transition-colors hover:text-text-primary"
            >
              {label}
            </a>
          ))}
          {RESOURCES_ITEMS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm-md text-text-secondary transition-colors hover:text-text-primary"
            >
              {label}
            </a>
          ))}
          <a
            href={`${APP_URL}/login`}
            className="flex h-10 items-center justify-center rounded-pill bg-btn-primary text-caption-lg text-text-on-primary"
          >
            Open App
          </a>
        </div>
      )}
    </PageGrid>
  );
}

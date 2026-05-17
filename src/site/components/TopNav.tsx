import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { LoaderPinwheel } from '@/components/animate-ui/icons/loader-pinwheel';
import { ICON_SIZE } from '../../constants/icons';
import { PageGrid } from './PageGrid';
import { NavDropdown } from './NavDropdown';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

const PRODUCT_ITEMS = [
  { label: 'Features', href: '#features' },
  { label: 'Integrations', href: '#integrations' },
];

const PLAIN_LINKS = [
  { label: 'Enterprise', href: '#enterprise' },
  { label: 'Pricing', href: '#pricing' },
];

const RESOURCES_ITEMS = [
  { label: 'Articles', href: '/articles' },
  { label: 'Guides', href: '/guides' },
  { label: 'Docs', href: '/docs' },
];

function useScrolled(threshold = 1) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrolled();

  return (
    <PageGrid as="header" className={`sticky top-0 z-50 w-full pt-6 pb-4 transition-[background-color,backdrop-filter] duration-300 ${scrolled ? 'bg-surface-base/80 backdrop-blur-md' : ''}`}>
      <div className="col-span-full flex items-center justify-between">
        <AnimateIcon animateOnHover asChild>
          <a href="/" className="flex items-center gap-2 shrink-0 text-text-primary">
            <LoaderPinwheel size={20} />
            <span className="text-body-md">Arvid</span>
          </a>
        </AnimateIcon>

        <nav className="hidden md:flex items-center gap-6">
          <NavDropdown trigger="Product" items={PRODUCT_ITEMS} />
          {PLAIN_LINKS.map(({ label, href }) => (
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
          className="site-btn-primary hidden md:flex"
        >
          Launch Arvid
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
          <span className="text-caption-sm text-text-tertiary">Product</span>
          {PRODUCT_ITEMS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm-md text-text-secondary transition-colors hover:text-text-primary pl-2"
            >
              {label}
            </a>
          ))}
          {PLAIN_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm-md text-text-secondary transition-colors hover:text-text-primary"
            >
              {label}
            </a>
          ))}
          <span className="text-caption-sm text-text-tertiary">Resources</span>
          {RESOURCES_ITEMS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm-md text-text-secondary transition-colors hover:text-text-primary pl-2"
            >
              {label}
            </a>
          ))}
          <a
            href={`${APP_URL}/login`}
            className="site-btn-primary justify-center"
          >
            Launch Arvid
          </a>
        </div>
      )}
    </PageGrid>
  );
}

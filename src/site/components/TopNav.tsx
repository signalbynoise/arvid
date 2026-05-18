import React, { useState, useEffect } from 'react';
import { AlignJustify, X } from 'lucide-react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { LoaderPinwheel } from '@/components/animate-ui/icons/loader-pinwheel';
import { PageGrid } from './PageGrid';
import { NavDropdown } from './NavDropdown';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const DOWNLOAD_MAC_URL =
  import.meta.env.VITE_DOWNLOAD_MAC_URL ||
  'https://github.com/signalbynoise/arvid/releases/latest/download/Arvid-1.0.0-arm64.dmg';

const PRODUCT_ITEMS = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
];

const PLAIN_LINKS = [
  { label: 'Enterprise', href: '/enterprise' },
  { label: 'Saga', href: '/saga' },
  { label: 'Pricing', href: '#pricing' },
];

const RESOURCES_ITEMS = [
  { label: 'Articles', href: '/articles' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Guides', href: '/guides' },
  { label: 'Docs', href: '/docs' },
];

const MOBILE_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Enterprise', href: '/enterprise' },
  { label: 'Saga', href: '/saga' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Articles', href: '/articles' },
  { label: 'Changelog', href: '/changelog' },
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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <PageGrid
        as="header"
        className={`sticky top-0 z-50 w-full pt-6 pb-4 transition-[background-color,backdrop-filter] duration-300 ${scrolled ? 'bg-surface-base/80 backdrop-blur-md' : ''}`}
      >
        <div className="col-span-full relative flex items-center justify-between">
          {/* Logo — identical on both breakpoints: 24px icon + 16px text */}
          <AnimateIcon animateOnHover asChild>
            <a
              href="/"
              className="flex items-center gap-2 shrink-0 text-text-primary"
            >
              <LoaderPinwheel size={24} />
              <span className="text-body-md">Arvid</span>
            </a>
          </AnimateIcon>

          {/* Desktop center nav — absolute centered */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
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

          {/* Desktop right button */}
          <a href={`${APP_URL}/login`} className="hidden md:flex site-btn-primary">
            Open App
          </a>

          {/* Mobile right — Download button + hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <a href={DOWNLOAD_MAC_URL} className="site-btn-primary">
              Download
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="text-text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <AlignJustify size={24} />}
            </button>
          </div>
        </div>
      </PageGrid>

      {/* Mobile menu — full-screen overlay above content */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-surface-base md:hidden">
          <div className="px-[var(--grid-margin)] pt-6">
            <div className="flex items-center justify-between">
              <AnimateIcon animateOnHover asChild>
                <a
                  href="/"
                  className="flex items-center gap-2 shrink-0 text-text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <LoaderPinwheel size={24} />
                  <span className="text-body-md">Arvid</span>
                </a>
              </AnimateIcon>
              <div className="flex items-center gap-3">
                <a href={DOWNLOAD_MAC_URL} className="site-btn-primary">
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-text-primary transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <nav className="flex flex-col gap-4 pt-20">
              {MOBILE_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-h2 text-text-primary transition-colors hover:text-text-secondary"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

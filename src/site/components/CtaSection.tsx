import React from 'react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { LoaderPinwheel } from '@/components/animate-ui/icons/loader-pinwheel';
import { PageGrid } from './PageGrid';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export function CtaSection() {
  return (
    <PageGrid as="section" className="w-full py-30">
      <div className="col-span-full lg:col-start-3 lg:col-span-8 flex flex-col items-center gap-10 text-center">
        <h2 className="text-display lg:text-display-md text-text-primary">
          Build with Arvid today.
        </h2>

        <AnimateIcon animateOnHover asChild>
          <a href={`${APP_URL}/login`} className="site-btn-primary">
            Launch Arvid
            <LoaderPinwheel size={16} />
          </a>
        </AnimateIcon>
      </div>
    </PageGrid>
  );
}

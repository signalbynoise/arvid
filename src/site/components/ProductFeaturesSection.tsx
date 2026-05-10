import React from 'react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';
import { PageGrid } from './PageGrid';

const FEATURES = [
  {
    title: 'Arvid loves Linear',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
  },
  {
    title: 'Arvid talks to Slack',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
  },
];

export function ProductFeaturesSection() {
  return (
    <PageGrid as="section" className="w-full">
      <h2 className="col-span-full text-h2 text-text-primary">
        Arvid can do a lot
      </h2>

      {FEATURES.map(feature => (
        <div
          key={feature.title}
          className="col-span-full lg:col-span-6 flex flex-col justify-between rounded-card bg-surface-panel pt-10 px-5 h-100"
        >
          <div className="flex flex-col gap-2">
            <h3 className="text-btn text-text-primary">
              {feature.title}
            </h3>
            <p className="text-btn text-text-tertiary">
              {feature.description}
            </p>
          </div>
          <div className="w-full h-65 rounded-tl-card rounded-tr-card bg-surface-frost-10" />
        </div>
      ))}

      <AnimateIcon animateOnHover asChild>
        <a href="#" className="site-btn-secondary col-span-full">
          Browse all product features
          <ChevronRight size={16} />
        </a>
      </AnimateIcon>
    </PageGrid>
  );
}

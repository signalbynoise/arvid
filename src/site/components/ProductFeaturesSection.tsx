import React from 'react';
import { ArrowUpRight } from 'lucide-react';
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
      <h2 className="col-span-full text-[24px] font-[var(--fw-regular)] leading-normal text-text-primary">
        Arvid can do a lot
      </h2>

      {FEATURES.map(feature => (
        <div
          key={feature.title}
          className="col-span-full lg:col-span-6 flex flex-col justify-between rounded-card bg-surface-panel pt-10 px-5 h-[400px]"
        >
          <div className="flex flex-col gap-2">
            <h3 className="text-[12px] font-[var(--fw-medium)] text-text-primary">
              {feature.title}
            </h3>
            <p className="text-[12px] font-[var(--fw-regular)] leading-[1.5] text-text-tertiary">
              {feature.description}
            </p>
          </div>
          <div className="w-full h-[260px] rounded-tl-card rounded-tr-card bg-surface-frost-10" />
        </div>
      ))}

      <a
        href="#"
        className="col-span-full flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-[12px] font-[var(--fw-medium)] text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        <span>Browse all product features</span>
        <ArrowUpRight size={12} />
      </a>
    </PageGrid>
  );
}

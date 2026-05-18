import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PageGrid } from './PageGrid';

interface FeatureSectionProps {
  title: string;
  description: string;
  imagePosition: 'left' | 'right';
  linkHref?: string;
  linkLabel?: string;
  children?: React.ReactNode;
}

export function FeatureSection({ title, description, imagePosition, linkHref, linkLabel, children }: FeatureSectionProps) {
  const isImageRight = imagePosition === 'right';

  return (
    <PageGrid as="section" className="w-full">
      <div className="col-span-full overflow-hidden rounded-card bg-surface-panel">
        <div
          className={`flex flex-col lg:flex-row ${isImageRight ? '' : 'lg:flex-row-reverse'}`}
        >
          <div className="flex flex-col justify-center gap-6 px-8 py-10 lg:w-4/12 lg:shrink-0 lg:px-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-h3 text-text-primary">
                {title}
              </h2>
              <p className="text-body-lg text-text-tertiary">
                {description}
              </p>
            </div>
            {linkHref && linkLabel && (
              <a href={linkHref} className="site-btn-primary site-btn-md">
                {linkLabel}
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {children ? (
              <div className="h-[680px] w-full bg-surface-frost-05 overflow-hidden relative">
                {children}
              </div>
            ) : (
              <div className="h-[680px] w-full bg-surface-frost-10" />
            )}
          </div>
        </div>
      </div>
    </PageGrid>
  );
}

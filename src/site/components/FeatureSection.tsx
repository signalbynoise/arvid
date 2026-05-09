import React from 'react';
import { PageGrid } from './PageGrid';

interface FeatureSectionProps {
  title: string;
  description: string;
  imagePosition: 'left' | 'right';
  children?: React.ReactNode;
}

export function FeatureSection({ title, description, imagePosition, children }: FeatureSectionProps) {
  const isImageRight = imagePosition === 'right';

  return (
    <PageGrid as="section" className="w-full">
      <div className="col-span-full overflow-hidden rounded-card bg-surface-panel">
        <div
          className={`flex flex-col lg:flex-row ${isImageRight ? '' : 'lg:flex-row-reverse'}`}
        >
          <div className="flex flex-col justify-center gap-2 px-8 py-10 lg:w-[calc(4/12*100%)] lg:shrink-0 lg:px-10">
            <h2 className="text-[20px] font-[var(--fw-medium)] leading-normal text-text-primary">
              {title}
            </h2>
            <p className="text-[18px] font-[var(--fw-regular)] leading-[1.6] text-text-tertiary">
              {description}
            </p>
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

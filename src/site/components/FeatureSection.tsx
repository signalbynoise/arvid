import React from 'react';

interface FeatureSectionProps {
  title: string;
  description: string;
  imagePosition: 'left' | 'right';
}

export function FeatureSection({ title, description, imagePosition }: FeatureSectionProps) {
  const isImageRight = imagePosition === 'right';

  return (
    <section className="w-full px-6">
      <div className="mx-auto max-w-[1000px] overflow-hidden rounded-card bg-surface-panel">
        <div
          className={`flex flex-col md:flex-row md:h-[600px] ${isImageRight ? '' : 'md:flex-row-reverse'}`}
        >
          <div className="flex flex-col justify-center gap-2 px-8 py-10 md:w-[400px] md:shrink-0 md:px-10">
            <h2 className="text-[20px] font-[var(--fw-medium)] leading-normal text-text-primary">
              {title}
            </h2>
            <p className="text-[18px] font-[var(--fw-regular)] leading-[1.6] text-text-tertiary">
              {description}
            </p>
          </div>

          <div
            className={`flex-1 py-5 md:py-10 ${
              isImageRight ? 'px-5 md:pl-0 md:pr-0' : 'px-5 md:pr-0 md:pl-0'
            }`}
          >
            <div
              className={`h-[280px] md:h-full w-full bg-surface-frost-10 ${
                isImageRight ? 'rounded-l-card' : 'rounded-r-card'
              }`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import Dither from '../../../components/Dither';

export function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-surface-panel overflow-hidden">
      <div className="absolute inset-0">
        <Dither
          waveColor={[0.3607843137254902, 0.3607843137254902, 0.3607843137254902]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.4}
          colorNum={4}
          pixelSize={1}
          waveAmplitude={0.2}
          waveFrequency={5}
          waveSpeed={0.03}
        />
      </div>

      <div className="relative z-10 p-8">
        <img src="/logo_wide.svg" alt="Arvid" className="h-6" />
      </div>

      <div className="relative z-10 p-8 pb-12">
        <h2
          className="text-[32px] font-[var(--fw-medium)] leading-[1.13] tracking-[-0.704px] text-text-primary mb-3"
        >
          Build something
          <br />
          amazing today.
        </h2>
        <p className="text-[15px] font-[var(--fw-regular)] leading-[1.6] tracking-[-0.165px] text-text-tertiary max-w-[320px]">
          Structured requirements, intelligent questions, clear answers — all in one place.
        </p>
      </div>
    </div>
  );
}

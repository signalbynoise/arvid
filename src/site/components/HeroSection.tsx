import React from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import Dither from '@/components/Dither';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export function HeroSection() {
  return (
    <section className="w-full px-6 pt-[120px]">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
        <h1 className="text-[24px] font-[var(--fw-regular)] leading-normal text-text-primary">
          Arvid builds the missing knowledge graph,
          <br />
          all teams wanted.
        </h1>

        <div className="flex items-center gap-4">
          <a
            href={`${APP_URL}/login`}
            className="flex items-center gap-1 rounded-pill bg-btn-primary px-5 py-2.5 text-[14px] font-[var(--fw-medium)] text-text-on-primary transition-colors hover:bg-btn-primary-hover"
          >
            Launch Arvid
            <ArrowUpRight size={16} />
          </a>
          <a
            href="#product"
            className="flex items-center gap-1 rounded-pill bg-surface-frost-10 px-5 py-2.5 text-[14px] font-[var(--fw-medium)] text-text-primary transition-colors hover:bg-surface-frost-15"
          >
            Explore Features
            <ArrowDown size={16} />
          </a>
        </div>

        <div className="relative mt-[60px] h-[600px] w-full overflow-hidden rounded-card bg-surface-frost-08">
          <div className="absolute inset-0">
            <Dither
              waveColor={[0.3607843137254902, 0.3607843137254902, 0.3607843137254902]}
              disableAnimation={false}
              enableMouseInteraction
              mouseRadius={1}
              colorNum={4}
              pixelSize={2}
              waveAmplitude={0.3}
              waveFrequency={3}
              waveSpeed={0.05}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

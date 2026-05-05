import React from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import Grainient from '@/components/Grainient';
import { AppDemo } from './app-demo';
import { PageGrid } from './PageGrid';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export function HeroSection() {
  return (
    <PageGrid as="section" className="w-full pt-[120px]">
      <h1 className="col-span-full text-[24px] font-[var(--fw-regular)] leading-normal text-text-primary">
        Arvid builds the knowledge graph,
        <br />
        all teams need.
      </h1>

      <div className="col-span-full flex items-center gap-4">
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

      <div className="col-span-full relative mt-[60px] h-[600px] w-full overflow-hidden rounded-card bg-surface-frost-08">
        <div className="absolute inset-0">
          <Grainient
            color1="#616161"
            color2="#171717"
            color3="#363636"
            timeSpeed={0.25}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>
        <div className="absolute inset-0 z-10 flex items-center justify-center p-10">
          <AppDemo />
        </div>
      </div>
    </PageGrid>
  );
}

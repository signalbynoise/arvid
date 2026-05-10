import React from 'react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { LoaderPinwheel } from '@/components/animate-ui/icons/loader-pinwheel';
import { ChevronDown } from '@/components/animate-ui/icons/chevron-down';
import Grainient from '@/components/Grainient';
import { AppDemo } from './app-demo';
import { PageGrid } from './PageGrid';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export function HeroSection() {
  return (
    <PageGrid as="section" className="w-full pt-30">
      <h1 className="col-span-full text-h2 text-text-primary">
        Arvid builds the missing knowledge graph,
        <br />
        for your issues and agents.
      </h1>

      <div className="col-span-full flex items-center gap-4">
        <AnimateIcon animateOnHover asChild>
          <a href={`${APP_URL}/login`} className="site-btn-primary">
            Launch Arvid
            <LoaderPinwheel size={16} />
          </a>
        </AnimateIcon>
        <AnimateIcon animateOnHover asChild>
          <a href="#product" className="site-btn-secondary">
            Explore Features
            <ChevronDown size={16} />
          </a>
        </AnimateIcon>
      </div>

      <div data-cursor-boundary="hero" className="col-span-full relative mt-15 h-[680px] w-full overflow-hidden rounded-card bg-surface-frost-08">
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
        <div className="absolute inset-0 z-10 overflow-hidden">
          <AppDemo />
        </div>
      </div>
    </PageGrid>
  );
}

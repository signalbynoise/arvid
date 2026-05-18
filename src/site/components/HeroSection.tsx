import React from 'react';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { MorphingText } from '@/components/animate-ui/primitives/texts/morphing';
import Grainient from '@/components/Grainient';
import { AppDemo } from './app-demo';
import { PageGrid } from './PageGrid';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const DOWNLOAD_MAC_URL =
  import.meta.env.VITE_DOWNLOAD_MAC_URL ||
  'https://github.com/signalbynoise/arvid/releases/latest/download/Arvid-1.0.0-arm64.dmg';

const ROTATING_WORDS = [
  '#issues',
  '#agents',
  '#projects',
  '#tasks',
  '#features',
];

export function HeroSection() {
  return (
    <PageGrid as="section" className="w-full pt-30">
      {/* Headline — text-h2 (24px regular) both breakpoints */}
      <h1 className="col-span-full text-h2 text-text-primary max-w-[300px] md:max-w-none">
        Arvid builds the missing knowledge graph,
        <br />
        for your{' '}
        <MorphingText
          className="font-[var(--fw-semibold)]"
          text={ROTATING_WORDS}
          loop
          holdDelay={2500}
        />
      </h1>

      {/* Desktop CTAs — large primary + secondary with icons */}
      <div className="hidden md:flex col-span-full items-center gap-4">
        <a href={DOWNLOAD_MAC_URL} className="site-btn-primary site-btn-lg">
          Download for macOS
          <ArrowDownToLine size={18} />
        </a>
        <a href="/features" className="site-btn-secondary site-btn-lg">
          Explore Features
          <ArrowRight size={18} />
        </a>
      </div>

      {/* Mobile CTAs — large primary + secondary, no icons */}
      <div className="flex md:hidden col-span-full items-center gap-4">
        <a href={`${APP_URL}/login`} className="site-btn-primary site-btn-lg">
          Launch Arvid
        </a>
        <a href="/features" className="site-btn-secondary site-btn-lg">
          Explore Features
        </a>
      </div>

      {/* App preview — 800px desktop, bleeds right on mobile */}
      <div
        data-cursor-boundary="hero"
        className="col-span-full relative mt-10 h-[600px] md:h-[800px] w-full overflow-hidden rounded-tl-comfortable md:rounded-card bg-surface-frost-08 -mr-[var(--grid-margin)] md:mr-0"
      >
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

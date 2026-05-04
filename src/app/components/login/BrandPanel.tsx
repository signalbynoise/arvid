import React from 'react';
import Grainient from '../../../components/Grainient';

export function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-surface-panel overflow-hidden">
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

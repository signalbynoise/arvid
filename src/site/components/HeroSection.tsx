import React from 'react';
import { Layers, Play } from 'lucide-react';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center px-6 pt-24 pb-32 md:pt-36 md:pb-40">
      <div className="flex flex-col items-center max-w-[800px] text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-border-default bg-surface-frost-02 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
          <span className="text-[12px] font-[var(--fw-medium)] text-text-secondary">
            Now in beta
          </span>
        </div>

        <h1
          className="text-[48px] md:text-[64px] font-[var(--fw-medium)] leading-[1.00] tracking-[-1.056px] md:tracking-[-1.408px] text-text-primary mb-6"
        >
          Build requirements
          <br />
          <span className="text-text-tertiary">that actually ship.</span>
        </h1>

        <p className="text-[18px] font-[var(--fw-regular)] leading-[1.6] tracking-[-0.165px] text-text-tertiary max-w-[560px] mb-10">
          Arvid turns vague requirements into structured, validated knowledge. Ask the right questions, get clear answers, and ship with confidence.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href={`${APP_URL}/login`}
            className="flex h-10 items-center rounded-comfortable bg-accent-brand px-5 text-[14px] font-[var(--fw-medium)] text-white transition-colors hover:bg-accent-hover"
          >
            Get started
          </a>
          <a
            href="#features"
            className="flex h-10 items-center rounded-comfortable border border-border-default bg-surface-frost-02 px-5 text-[14px] font-[var(--fw-medium)] text-text-secondary transition-colors hover:bg-surface-frost-05 hover:text-text-primary"
          >
            Learn more
          </a>
        </div>
      </div>

      <div className="mt-20 w-full max-w-[1000px]">
        <div className="relative overflow-hidden rounded-panel border border-border-default bg-surface-frost-02">
          <div className="flex aspect-video items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-default bg-surface-frost-03">
                <Play size={24} className="text-text-quaternary ml-0.5" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[15px] font-[var(--fw-medium)] text-text-tertiary">
                  Product demo
                </p>
                <p className="text-[13px] font-[var(--fw-regular)] text-text-quaternary">
                  Video coming soon
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />
        </div>
      </div>
    </section>
  );
}

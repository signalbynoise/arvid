import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export function CtaSection() {
  return (
    <section className="w-full px-6 py-[120px]">
      <div className="mx-auto flex max-w-[600px] flex-col items-center gap-10 text-center">
        <h2 className="text-[48px] md:text-[56px] font-[var(--fw-regular)] leading-normal text-text-primary">
          Build with Arvid today.
        </h2>

        <a
          href={`${APP_URL}/login`}
          className="flex items-center gap-1 rounded-pill bg-btn-primary px-5 py-2.5 text-[14px] font-[var(--fw-medium)] text-text-on-primary transition-colors hover:bg-btn-primary-hover"
        >
          Launch Arvid
          <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}

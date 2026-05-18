import React from 'react';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { PageGrid } from './PageGrid';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const DOWNLOAD_MAC_URL = import.meta.env.VITE_DOWNLOAD_MAC_URL || 'https://github.com/signalbynoise/arvid/releases/latest/download/Arvid-1.0.0-arm64.dmg';

export function CtaSection() {
  return (
    <PageGrid as="section" className="w-full py-30">
      <div className="col-span-full lg:col-start-3 lg:col-span-8 flex flex-col items-center gap-10 text-center">
        <h2 className="text-display lg:text-display-md text-text-primary">
          Build with Arvid today.
        </h2>

        <div className="flex items-center gap-2">
          <a href={DOWNLOAD_MAC_URL} className="site-btn-primary site-btn-md">
            Download for macOS
            <ArrowDownToLine size={14} />
          </a>
          <a href={`${APP_URL}/login`} className="site-btn-outline site-btn-md">
            Launch Arvid
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </PageGrid>
  );
}

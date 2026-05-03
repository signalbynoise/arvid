import React from 'react';
import { TopNav } from '../components/TopNav';
import { HeroSection } from '../components/HeroSection';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary antialiased">
      <TopNav />
      <HeroSection />
    </div>
  );
}

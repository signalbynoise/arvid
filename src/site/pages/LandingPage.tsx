import React from 'react';
import { TopNav } from '../components/TopNav';
import { HeroSection } from '../components/HeroSection';
import { FeatureSection } from '../components/FeatureSection';
import { RequirementGridSection } from '../components/RequirementGridSection';
import { LearnMoreSection } from '../components/LearnMoreSection';
import { CtaSection } from '../components/CtaSection';

const FEATURES = [
  {
    title: 'Arvid knows your code',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    imagePosition: 'right' as const,
  },
  {
    title: 'Arvid is a good connector',
    description:
      'Bring in requirements from Slack, Email, or your documents. Do not worry, Arvid knows how to extract perfected requests from messy sources.',
    imagePosition: 'left' as const,
  },
  {
    title: 'Arvid loves Agents',
    description:
      'Send your complete knowledge graph to Cursor and make your Agents happy.',
    imagePosition: 'right' as const,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-text-primary antialiased">
      <TopNav />
      <HeroSection />

      <div className="flex flex-col gap-[120px] pt-[120px]">
        {FEATURES.map((feature, index) => (
          <FeatureSection
            key={index}
            title={feature.title}
            description={feature.description}
            imagePosition={feature.imagePosition}
          />
        ))}
      </div>

      <div className="pt-[120px]">
        <RequirementGridSection />
      </div>

      <div className="pt-[120px]">
        <LearnMoreSection />
      </div>

      <CtaSection />
    </div>
  );
}

import React from 'react';
import GridMotion from '@/components/GridMotion';
import { RequirementCard } from './RequirementCard';
import { SAMPLE_REQUIREMENTS } from '../data/sampleRequirements';

const gridItems = SAMPLE_REQUIREMENTS.map((req, i) => (
  <RequirementCard key={i} {...req} />
));

export function RequirementGridSection() {
  return (
    <section className="w-full px-6">
      <div className="mx-auto max-w-[1200px] overflow-hidden rounded-card relative h-[600px]">
        <GridMotion items={gridItems} gradientColor="black" />
      </div>
    </section>
  );
}

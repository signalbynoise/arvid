import React from 'react';
import GridMotion from '@/components/GridMotion';
import { RequirementCard } from './RequirementCard';
import { SAMPLE_REQUIREMENTS } from '../data/sampleRequirements';
import { PageGrid } from './PageGrid';

const gridItems = SAMPLE_REQUIREMENTS.map((req, i) => (
  <RequirementCard key={i} {...req} />
));

export function RequirementGridSection() {
  return (
    <PageGrid as="section" className="w-full">
      <div className="col-span-full overflow-hidden rounded-card relative h-[600px]">
        <GridMotion items={gridItems} gradientColor="black" />
      </div>
    </PageGrid>
  );
}

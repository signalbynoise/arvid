import React from 'react';
import { PageGrid } from './PageGrid';

const INTEGRATIONS = [
  { name: 'GitHub', src: '/github.svg' },
  { name: 'Gmail', src: '/gmail.svg' },
  { name: 'Microsoft', src: '/microsoft.svg' },
  { name: 'Slack', src: '/slack.svg' },
  { name: 'Linear', src: '/linear.svg' },
  { name: 'Cursor', src: '/cursor.svg' },
  { name: 'Claude', src: '/claude.svg' },
  { name: 'Lovable', src: '/lovable.svg' },
];

export function IntegrationsSection() {
  return (
    <PageGrid as="section" className="w-full">
      <h2 className="col-span-full text-center text-h2 text-text-primary">
        Arvid works with everyone. In and out.
      </h2>
      <div className="col-span-full lg:col-start-3 lg:col-span-8 flex flex-wrap items-center justify-center gap-8 md:gap-10 lg:justify-between">
        {INTEGRATIONS.map(integration => (
          <div key={integration.name} className="size-12 shrink-0">
            <img
              src={integration.src}
              alt={integration.name}
              className="h-full w-full object-contain"
            />
          </div>
        ))}
      </div>
    </PageGrid>
  );
}

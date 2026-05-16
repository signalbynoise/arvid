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
  { name: 'Figma', src: '/figma.svg' },
  { name: 'Render', src: '/render.svg' },
  { name: 'Resend', src: '/resend.svg' },
];

export function IntegrationsSection() {
  return (
    <PageGrid as="section" className="w-full">
      <h2 className="col-span-full text-center text-h2 text-text-primary">
        Arvid works with everyone. In and out.
      </h2>
      <div className="col-span-full lg:col-start-3 lg:col-span-8 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 place-items-center gap-8 md:gap-10">
        {INTEGRATIONS.map(integration => (
          <div key={integration.name} className="size-12">
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

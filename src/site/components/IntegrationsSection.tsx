import React from 'react';

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
    <section className="w-full px-6">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10">
        <h2 className="text-[24px] font-[var(--fw-regular)] leading-normal text-text-primary">
          Arvid works with everyone. In and out.
        </h2>
        <div className="flex w-full max-w-[800px] items-center justify-between">
          {INTEGRATIONS.map(integration => (
            <div key={integration.name} className="h-16 w-16 shrink-0">
              <img
                src={integration.src}
                alt={integration.name}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

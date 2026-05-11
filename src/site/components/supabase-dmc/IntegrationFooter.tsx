import React from 'react';
import { IntegrationRow } from './IntegrationRow';

interface IntegrationFooterProps {
  databaseValue: string;
  visible: boolean;
  databaseOverlay?: React.ReactNode;
}

export function IntegrationFooter({ databaseValue, visible, databaseOverlay }: IntegrationFooterProps) {
  return (
    <div className={`bg-surface-panel rounded-comfortable py-4 flex flex-col gap-6 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <IntegrationRow
        icon={<img src="/github.svg" alt="" className="w-3.5 h-3.5" />}
        label="REPOSITORY"
        value="arvid/arvid"
      />

      <div className="h-px bg-border-subtle" />

      <div className="relative">
        <IntegrationRow
          icon={<img src="/supabase.svg" alt="" className="w-3.5 h-3.5" />}
          label="DATABASE"
          value={databaseValue}
          cursorTarget="dmc-db-trigger"
        />
        {databaseOverlay && (
          <div className="absolute bottom-0 left-0 right-0 z-10 px-4">
            {databaseOverlay}
          </div>
        )}
      </div>

      <div className="h-px bg-border-subtle" />

      <IntegrationRow
          icon={<img src="/linear.svg" alt="" className="w-3.5 h-3.5" />}
          label="PROJECT"
        value="Arvid"
      />

      <div className="h-px bg-border-subtle" />

      <IntegrationRow
          icon={<img src="/slack.svg" alt="" className="w-3.5 h-3.5" />}
          label="ALERTS"
        value="#arvid-alerts"
      />
    </div>
  );
}

import { MiniSidebar, MiniSidebarFooterItem } from '../mini-demo';
import { WORKSPACE_NAME, TEAMS } from './data';

interface DemoSidebarProps {
  expanded: boolean;
}

export function DemoSidebar({ expanded }: DemoSidebarProps) {
  return (
    <MiniSidebar
      workspaceName={WORKSPACE_NAME}
      teams={TEAMS}
      expandedProjectId={expanded ? 'p1' : undefined}
      footer={
        <div className="border-t border-border-subtle shrink-0 py-2 space-y-2">
          <MiniSidebarFooterItem icon="/github.svg" label="Repository" isConnected value="acme/mobile-app" />
          <div className="border-t border-border-subtle" />
          <MiniSidebarFooterItem icon="/linear.svg" label="Project" isConnected value="Mobile App" />
          <div className="border-t border-border-subtle" />
          <MiniSidebarFooterItem icon="/slack.svg" label="Alerts" isConnected value="#mobile-alerts" />
        </div>
      }
    />
  );
}

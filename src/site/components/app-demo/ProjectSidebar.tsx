import { MiniSidebar, MiniSidebarFooterItem, MiniDivider, MiniSidebarFooter } from '../mini-demo';
import { WORKSPACE_NAME, TEAMS } from './data';

interface ProjectSidebarProps {
  expanded: boolean;
}

export function ProjectSidebar({ expanded }: ProjectSidebarProps) {
  return (
    <MiniSidebar
      workspaceName={WORKSPACE_NAME}
      teams={TEAMS}
      expandedProjectId={expanded ? 'p1' : undefined}
      footer={
        <>
          <MiniDivider />
          <MiniSidebarFooter>
            <MiniSidebarFooterItem icon="/github.svg" label="Repository" isConnected value="acme/mobile-app" />
            <MiniDivider />
            <MiniSidebarFooterItem icon="/linear.svg" label="Project" isConnected value="Mobile App" />
            <MiniDivider />
            <MiniSidebarFooterItem icon="/slack.svg" label="Alerts" isConnected value="#mobile-alerts" />
          </MiniSidebarFooter>
        </>
      }
    />
  );
}

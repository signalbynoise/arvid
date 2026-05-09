export interface MiniTeam {
  id: string;
  name: string;
  projects: MiniProject[];
}

export interface MiniProject {
  id: string;
  name: string;
  isActive?: boolean;
  children: { id: string; name: string }[];
}

export interface MiniSidebarFooterItemData {
  icon: string;
  label: string;
  value?: string;
  isConnected: boolean;
}

export interface BreadcrumbSegment {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface CursorPosition {
  id: string;
  x: string;
  y: string;
  visible?: boolean;
}

export interface Step {
  action: string;
  delay: number;
  cursors?: CursorPosition[];
}

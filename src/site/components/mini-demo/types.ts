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
  target: string;
  visible?: boolean;
}

export interface Step {
  action: string;
  delay: number;
  cursors?: CursorPosition[];
}

// ── Rule-based demo engine types ─────────────────────────────────

export interface DemoState {
  requirements: string[];
  selectedRequirement: string | null;
  questions: Record<string, string[]>;
  acceptedQuestions: string[];
  selectedQuestion: string | null;
  answers: Record<string, string[]>;
  summaryGenerated: boolean;
  completeness: number;
  modalPhase: null | 'open' | 'importing' | 'extracting' | 'suggestions' | 'selected';
  exports: string[];
  browsed: boolean;
  imported: boolean;
  cycleCount: number;
}

export interface Transition {
  actor: string;
  verb: string;
  subject: string;
  stateUpdate: (prev: DemoState) => DemoState;
}

export interface Actor {
  id: string;
  name: string;
}

export interface Rule {
  actor: string;
  weight?: number;
  canExecute: (state: DemoState) => boolean;
  execute: (state: DemoState, pool: ContentPool) => Transition;
}

export interface ContentPool {
  requirements: Array<{ id: string; [key: string]: unknown }>;
  questions: Record<string, Array<{ id: string; [key: string]: unknown }>>;
  answers: Record<string, Array<{ id: string; [key: string]: unknown }>>;
  slackSuggestions?: Array<{ id: string; text: string; source: string }>;
}

export interface Direction {
  goal: (state: DemoState) => boolean;
  actors: Actor[];
  rules: Rule[];
  contentPool: ContentPool;
  initialState?: Partial<DemoState>;
}

export interface EngineOutput {
  state: DemoState;
  currentTransition: Transition | null;
  activeActor: string | null;
}

export interface DemoColumn {
  key: string;
  title: string;
  borderRight?: boolean;
}

export interface DemoLayoutConfig {
  boundaryId: string;
  workspace: string;
  breadcrumbs: Array<{ label: string; icon?: React.ComponentType<{ size?: number; className?: string }> }>;
  sidebar: {
    teams: Array<{ id: string; name: string; projects: Array<{ id: string; name: string; isActive?: boolean; children: { id: string; name: string }[] }> }>;
    expandedProjectId?: string;
    integrations?: Array<{ icon: string; label: string; value?: string; connected: boolean }>;
  };
  columns: DemoColumn[];
  shell: {
    className: string;
    containerClassName?: string;
    shadow?: boolean;
    roundedRight?: boolean;
    roundedBottom?: boolean;
  };
  modal?: {
    title: string;
    extractingMessage: string;
    importOptions?: Array<{ icon: string; label: string; primary?: boolean }>;
  };
  showAnswers?: boolean;
  showSummary?: boolean;
}

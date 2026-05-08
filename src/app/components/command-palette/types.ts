import { LucideIcon } from 'lucide-react';

export type CommandCategory = 'Create' | 'Edit' | 'Navigation' | 'Integrations';

export type ContextKey = 'selectedProjectId' | 'selectedReqId' | 'selectedQuestionId' | 'activeWorkspaceId';

export interface PaletteCommand {
  id: string;
  label: string;
  icon: LucideIcon;
  category: CommandCategory;
  keywords: string[];
  chord?: string;
  contextRequired?: ContextKey[];
  action: () => void | Promise<void>;
}

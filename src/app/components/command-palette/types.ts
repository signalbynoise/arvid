import { LucideIcon } from 'lucide-react';

export type CommandCategory = 'Create' | 'Navigation' | 'Integrations';

export interface PaletteCommand {
  id: string;
  label: string;
  icon: LucideIcon;
  category: CommandCategory;
  keywords: string[];
  shortcut?: string;
  action: () => void | Promise<void>;
}

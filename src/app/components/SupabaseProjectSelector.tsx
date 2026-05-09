import React, { useEffect, useState } from 'react';
import { Loader2, Database } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { FooterDropdownTrigger } from './FooterDropdownTrigger';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('SupabaseProjectSelector');

interface SupabaseProjectSelectorProps {
  projectId: string;
  onLinked?: () => void;
}

export function SupabaseProjectSelector({ projectId, onLinked }: SupabaseProjectSelectorProps) {
  const supabaseProjects = useStore(s => s.supabaseProjects);
  const loadSupabaseProjects = useStore(s => s.loadSupabaseProjects);
  const linkSupabaseToProject = useStore(s => s.linkSupabaseToProject);
  const fetchDbContext = useStore(s => s.fetchDbContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && supabaseProjects.length === 0) {
      setIsLoading(true);
      loadSupabaseProjects().finally(() => setIsLoading(false));
    }
  }, [isOpen, supabaseProjects.length, loadSupabaseProjects]);

  const handleSelect = async (supabaseProjectRef: string) => {
    setIsLinking(true);
    log.info('select', 'Linking Supabase project', { projectId, supabaseProjectRef });

    try {
      await linkSupabaseToProject(projectId, supabaseProjectRef);
      setIsOpen(false);
      fetchDbContext(projectId);
      onLinked?.();
    } catch (err) {
      log.error('select', 'Failed to link Supabase project', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="relative">
      <FooterDropdownTrigger onClick={() => setIsOpen(!isOpen)} disabled={isLinking} isOpen={isOpen}>
        <span className="text-text-tertiary">{isLinking ? 'Linking...' : 'Select project'}</span>
      </FooterDropdownTrigger>

      <DropdownPanel isOpen={isOpen} variant="attached" position="above">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={ICON_SIZE.md} className="animate-spin text-text-quaternary" />
          </div>
        ) : supabaseProjects.length === 0 ? (
          <div className="px-3 py-4 text-center text-text-quaternary">
            No active projects found.
          </div>
        ) : (
          <DropdownSection label="SUPABASE PROJECTS">
            {supabaseProjects.map(proj => (
              <DropdownItem
                key={proj.id}
                icon={<Database size={ICON_SIZE.md} />}
                label={proj.name}
                sublabel={proj.region}
                onClick={() => handleSelect(proj.id)}
              />
            ))}
          </DropdownSection>
        )}
      </DropdownPanel>
    </div>
  );
}

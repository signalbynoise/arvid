import React, { useEffect, useState } from 'react';
import { LoaderPinwheel, Database } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { useStore } from '../store';
import { logger } from '../logger';

const log = logger.create('LinkDatabaseModal');

interface LinkDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onLinked: () => void;
}

export function LinkDatabaseModal({ isOpen, onClose, projectId, onLinked }: LinkDatabaseModalProps) {
  const supabaseProjects = useStore(s => s.supabaseProjects);
  const loadSupabaseProjects = useStore(s => s.loadSupabaseProjects);
  const linkSupabaseToProject = useStore(s => s.linkSupabaseToProject);
  const fetchDbContext = useStore(s => s.fetchDbContext);

  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadSupabaseProjects().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadSupabaseProjects]);

  const handleSelect = async (supabaseProjectRef: string) => {
    setIsLinking(true);
    log.info('select', 'Linking Supabase project', { projectId, supabaseProjectRef });

    try {
      await linkSupabaseToProject(projectId, supabaseProjectRef);
      fetchDbContext(projectId);
      onLinked();
      onClose();
    } catch (err) {
      log.error('select', 'Failed to link Supabase project', {
        error: err instanceof Error ? err.message : 'Unknown',
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Link Database" size="sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderPinwheel size={ICON_SIZE.lg} className="animate-spin text-text-quaternary" />
        </div>
      ) : supabaseProjects.length === 0 ? (
        <p className="text-[13px] text-text-quaternary text-center py-8">No active projects found.</p>
      ) : (
        <div className="max-h-[320px] overflow-y-auto hide-scrollbar space-y-0.5">
          {supabaseProjects.map(proj => (
            <button
              key={proj.id}
              type="button"
              disabled={isLinking}
              onClick={() => handleSelect(proj.id)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-comfortable text-left transition-colors hover:bg-surface-frost-04 disabled:opacity-50"
            >
              <span className="shrink-0 text-text-quaternary">
                <Database size={ICON_SIZE.md} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] text-text-secondary truncate">{proj.name}</p>
                <p className="text-[12px] text-text-quaternary">{proj.region}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </BaseModal>
  );
}

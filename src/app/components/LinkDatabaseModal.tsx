import React, { useEffect, useState } from 'react';
import { LoaderPinwheel, Database } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { BaseModal } from './BaseModal';
import { PickerList, PickerItem } from './ui/PickerList';
import { useStore } from '../store';
import { useLinkIntegration } from '../machines/mutations/useLinkIntegration';

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

  const { error, isLinking, link } = useLinkIntegration({
    integrationType: 'supabase',
    link: async (payload) => {
      await linkSupabaseToProject(projectId, payload.supabaseProjectRef as string);
      fetchDbContext(projectId);
    },
    onLinked,
    onClose,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadSupabaseProjects().finally(() => setIsLoading(false));
    }
  }, [isOpen, loadSupabaseProjects]);

  const handleSelect = (supabaseProjectRef: string) => {
    link({ supabaseProjectRef });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Link Database" size="sm">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoaderPinwheel size={ICON_SIZE.lg} className="animate-spin text-text-quaternary" />
        </div>
      ) : supabaseProjects.length === 0 ? (
        <p className="text-caption-lg text-text-quaternary text-center py-8">No active projects found.</p>
      ) : (
        <PickerList>
          {error && <p className="text-caption-lg text-status-error px-3">{error}</p>}
          {supabaseProjects.map(proj => (
            <PickerItem
              key={proj.id}
              icon={<Database size={ICON_SIZE.md} />}
              label={proj.name}
              right={<span className="text-label text-text-quaternary">{proj.region}</span>}
              disabled={isLinking}
              onClick={() => handleSelect(proj.id)}
            />
          ))}
        </PickerList>
      )}
    </BaseModal>
  );
}

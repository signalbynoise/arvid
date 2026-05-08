import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { BaseModal } from './BaseModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  hasChildren: boolean;
}

export function DeleteProjectModal({ isOpen, onClose, projectId, projectName, hasChildren }: Props) {
  const deleteProject = useStore(s => s.deleteProject);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteProject(projectId);
    setIsDeleting(false);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Delete Project" size="sm">
      <div className="space-y-5">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-status-error-surface flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={20} className="text-status-error" />
          </div>
          <div>
            <p className="text-caption-lg text-text-primary">
              Are you sure you want to delete <span className="font-[var(--fw-medium)]">{projectName}</span>?
            </p>
            {hasChildren && (
              <p className="text-caption text-status-warning mt-2">
                This will also delete all sub-projects within it.
              </p>
            )}
            <p className="text-caption text-text-tertiary mt-2">
              Requirements in this project will be unlinked, not deleted.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-primary"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

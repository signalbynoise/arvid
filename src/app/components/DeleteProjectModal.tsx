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
            <p className="text-[14px] text-text-primary leading-relaxed">
              Are you sure you want to delete <span className="font-[var(--fw-medium)]">{projectName}</span>?
            </p>
            {hasChildren && (
              <p className="text-[13px] text-status-warning mt-2 leading-relaxed">
                This will also delete all sub-projects within it.
              </p>
            )}
            <p className="text-[13px] text-text-tertiary mt-2 leading-relaxed">
              Requirements in this project will be unlinked, not deleted.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-[var(--fw-medium)] text-text-tertiary hover:text-text-primary transition-colors rounded-comfortable"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`px-4 py-2 text-[13px] font-[var(--fw-medium)] rounded-comfortable transition-colors ${
              isDeleting
                ? 'bg-status-error-fill-faint text-status-error/50 cursor-not-allowed'
                : 'bg-status-error-fill-muted text-status-error hover:bg-status-error-fill-hover border border-status-error-border-strong'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

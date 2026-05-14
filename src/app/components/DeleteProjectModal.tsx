import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { useStore } from '../store';
import { BaseModal } from './BaseModal';
import { ModalFooter } from './ui/ModalFooter';
import { SubmitButton } from './ui/SubmitButton';

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

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    await deleteProject(projectId);
    setIsDeleting(false);
    onClose();
  }, [deleteProject, projectId, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isDeleting) {
      e.preventDefault();
      handleDelete();
    }
  }, [isDeleting, handleDelete]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const modalFooter = (
    <ModalFooter>
      <button onClick={onClose} className="btn-ghost">Cancel</button>
      <SubmitButton onClick={handleDelete} label="Delete" loadingLabel="Deleting..." isLoading={isDeleting} />
    </ModalFooter>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Delete Project" size="sm" footer={modalFooter}>
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-status-error-surface flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={ICON_SIZE.lg} className="text-status-error" />
        </div>
        <div>
          <p className="text-caption-lg text-text-primary">
            Are you sure you want to delete <span className="text-caption-lg">{projectName}</span>?
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
    </BaseModal>
  );
}

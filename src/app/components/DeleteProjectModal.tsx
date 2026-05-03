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
          <div className="w-10 h-10 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={20} className="text-[#ef4444]" />
          </div>
          <div>
            <p className="text-[14px] text-[#f7f8f8] leading-relaxed">
              Are you sure you want to delete <span className="font-[510]">{projectName}</span>?
            </p>
            {hasChildren && (
              <p className="text-[13px] text-[#f59e0b] mt-2 leading-relaxed">
                This will also delete all sub-projects within it.
              </p>
            )}
            <p className="text-[13px] text-[#8a8f98] mt-2 leading-relaxed">
              Requirements in this project will be unlinked, not deleted.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-[510] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors rounded-[6px]"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`px-4 py-2 text-[13px] font-[510] rounded-[6px] transition-colors ${
              isDeleting
                ? 'bg-[rgba(239,68,68,0.2)] text-[#ef4444]/50 cursor-not-allowed'
                : 'bg-[rgba(239,68,68,0.15)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.25)] border border-[rgba(239,68,68,0.3)]'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

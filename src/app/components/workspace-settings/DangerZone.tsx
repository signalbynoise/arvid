import React, { useState } from 'react';

interface DangerZoneProps {
  canLeave: boolean;
  canDelete: boolean;
  onLeave: () => void;
  onDelete: () => void;
}

export function DangerZone({ canLeave, canDelete, onLeave, onDelete }: DangerZoneProps) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!canLeave && !canDelete) return null;

  return (
    <div className="pt-4 border-t border-border-subtle space-y-3">
      <h3 className="text-caption-lg text-status-error">Danger Zone</h3>

      {canLeave && (
        confirmLeave ? (
          <div className="flex items-center gap-3">
            <span className="text-caption-lg text-text-secondary">
              You will lose access to this workspace and its projects.
            </span>
            <button onClick={onLeave} className="btn-primary shrink-0">
              Confirm
            </button>
            <button onClick={() => setConfirmLeave(false)} className="btn-ghost shrink-0">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmLeave(true)} className="btn-primary">
            Leave workspace
          </button>
        )
      )}

      {canDelete && (
        confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="text-caption-lg text-text-secondary">
              This will archive the workspace and all its teams and projects.
            </span>
            <button onClick={onDelete} className="btn-primary shrink-0">
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost shrink-0">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="btn-primary">
            Delete workspace
          </button>
        )
      )}
    </div>
  );
}

import React, { useState } from 'react';

interface DangerZoneTabProps {
  canDeactivate: boolean;
  projectName: string;
  onDeactivate: () => void;
}

export function DangerZoneTab({ canDeactivate, projectName, onDeactivate }: DangerZoneTabProps) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  return (
    <div className="p-5 space-y-6">
      <h3 className="text-caption-lg text-status-error">Danger Zone</h3>

      {canDeactivate ? (
        confirmDeactivate ? (
          <div className="space-y-3">
            <p className="text-caption-lg text-text-secondary">
              This will archive <span className="text-text-primary">{projectName}</span> and all its contents. Nothing is permanently deleted.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={onDeactivate} className="btn-primary">
                Confirm
              </button>
              <button onClick={() => setConfirmDeactivate(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmDeactivate(true)} className="btn-primary">
            Deactivate project
          </button>
        )
      ) : (
        <p className="text-caption-lg text-text-quaternary">
          This project cannot be deactivated at this time.
        </p>
      )}
    </div>
  );
}

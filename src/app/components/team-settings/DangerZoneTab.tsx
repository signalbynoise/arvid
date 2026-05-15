import React, { useState } from 'react';

interface DangerZoneTabProps {
  canDeactivate: boolean;
  teamName: string;
  onDeactivate: () => void;
}

export function DangerZoneTab({ canDeactivate, teamName, onDeactivate }: DangerZoneTabProps) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  return (
    <div className="p-5 space-y-6">
      <h3 className="text-caption-lg text-status-error">Danger Zone</h3>

      {canDeactivate ? (
        confirmDeactivate ? (
          <div className="space-y-3">
            <p className="text-caption-lg text-text-secondary">
              This will archive <span className="text-text-primary">{teamName}</span> and all its projects. Nothing is permanently deleted.
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
            Deactivate team
          </button>
        )
      ) : (
        <p className="text-caption-lg text-text-quaternary">
          This team cannot be deactivated at this time.
        </p>
      )}
    </div>
  );
}

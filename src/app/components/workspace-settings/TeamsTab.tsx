import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { TextInput } from '../ui/TextInput';

interface Team {
  id: string;
  name: string;
}

interface TeamsTabProps {
  teams: Team[];
  projectCountByTeam: Map<string, number>;
  canManage: boolean;
  onCreateTeam: () => void;
  onRenameTeam: (teamId: string, name: string) => Promise<void>;
  onDeleteTeam: (teamId: string) => void;
}

export function TeamsTab({
  teams,
  projectCountByTeam,
  canManage,
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
}: TeamsTabProps) {
  const [localNames, setLocalNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const names: Record<string, string> = {};
    for (const team of teams) names[team.id] = team.name;
    setLocalNames(names);
  }, [teams]);

  const handleSave = async (teamId: string) => {
    const trimmed = (localNames[teamId] ?? '').trim();
    const original = teams.find(t => t.id === teamId)?.name;
    if (!trimmed) {
      setLocalNames(prev => ({ ...prev, [teamId]: original ?? '' }));
      return;
    }
    if (trimmed !== original) {
      await onRenameTeam(teamId, trimmed);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-label-upper text-text-tertiary">
          Teams ({teams.length})
        </span>
        {canManage && (
          <button
            onClick={onCreateTeam}
            className="flex items-center gap-1.5 text-label text-text-tertiary hover:text-text-primary transition-colors"
          >
            <Plus size={ICON_SIZE.sm} />
            <span>Add team</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {teams.map(team => (
          <div key={team.id} className="flex items-center gap-2">
            <div className="flex-1">
              <TextInput
                value={localNames[team.id] ?? team.name}
                onChange={(v) => setLocalNames(prev => ({ ...prev, [team.id]: v }))}
                onBlur={() => handleSave(team.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave(team.id);
                }}
                disabled={!canManage}
              />
            </div>
            <span className="text-label text-text-quaternary shrink-0">
              {projectCountByTeam.get(team.id) ?? 0} projects
            </span>
            {canManage && (
              <button
                onClick={() => onDeleteTeam(team.id)}
                className="p-1 text-text-quaternary hover:text-status-error transition-colors rounded-standard shrink-0"
                title="Delete team"
              >
                <Trash2 size={ICON_SIZE.xs} />
              </button>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <p className="text-caption-lg text-text-empty text-center py-6">No teams yet.</p>
        )}
      </div>
    </div>
  );
}

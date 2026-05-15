import React from 'react';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import type { Team } from '../../types';

interface GeneralTabProps {
  team: Team;
  nameValue: string;
  onNameChange: (value: string) => void;
  nameError: string | null;
  canManage: boolean;
}

const FORMAT_DATE = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export function GeneralTab({ team, nameValue, onNameChange, nameError, canManage }: GeneralTabProps) {
  return (
    <div className="p-5 space-y-8">
      <FormField label="Team Name" error={nameError}>
        <TextInput
          value={nameValue}
          onChange={onNameChange}
          disabled={!canManage}
          hasError={!!nameError}
        />
      </FormField>

      <FormField label="Slug">
        <TextInput
          value={team.slug}
          onChange={() => {}}
          disabled
        />
      </FormField>

      {team.shortId && (
        <FormField label="Short ID">
          <TextInput
            value={team.shortId}
            onChange={() => {}}
            disabled
          />
        </FormField>
      )}

      <FormField label="Created">
        <TextInput
          value={FORMAT_DATE(team.createdAt)}
          onChange={() => {}}
          disabled
        />
      </FormField>
    </div>
  );
}

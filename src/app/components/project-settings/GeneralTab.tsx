import React from 'react';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import type { Project, Team } from '../../types';

interface GeneralTabProps {
  project: Project;
  nameValue: string;
  onNameChange: (value: string) => void;
  nameError: string | null;
  canManage: boolean;
  parentProject: Project | undefined;
  team: Team | undefined;
}

const FORMAT_DATE = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export function GeneralTab({ project, nameValue, onNameChange, nameError, canManage, parentProject, team }: GeneralTabProps) {
  return (
    <div className="p-5 space-y-8">
      <FormField label="Project Name" error={nameError}>
        <TextInput
          value={nameValue}
          onChange={onNameChange}
          disabled={!canManage}
          hasError={!!nameError}
        />
      </FormField>

      {parentProject && (
        <FormField label="Parent Project">
          <TextInput
            value={parentProject.name}
            onChange={() => {}}
            disabled
          />
        </FormField>
      )}

      {team && (
        <FormField label="Team">
          <TextInput
            value={team.name}
            onChange={() => {}}
            disabled
          />
        </FormField>
      )}

      {project.shortId && (
        <FormField label="Short ID">
          <TextInput
            value={project.shortId}
            onChange={() => {}}
            disabled
          />
        </FormField>
      )}

      {project.createdAt && (
        <FormField label="Created">
          <TextInput
            value={FORMAT_DATE(project.createdAt)}
            onChange={() => {}}
            disabled
          />
        </FormField>
      )}
    </div>
  );
}

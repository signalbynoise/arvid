import { Requirement, Question, Answer } from '../../types';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';

interface MetadataTabProps {
  type: 'requirement' | 'question' | 'answer';
  data: Requirement | Question | Answer;
  authorName: string | undefined;
  authorTeam: string | undefined;
  authorRole: string | undefined;
  createdAt: string | undefined;
}

export function MetadataTab({
  type,
  data,
  authorName,
  authorTeam,
  authorRole,
  createdAt,
}: MetadataTabProps) {
  const isReq = type === 'requirement';
  const isAnswer = type === 'answer';

  const req = data as Requirement;

  return (
    <div className="p-5 space-y-4">
      <FormField label="Author">
        <TextInput value={authorName || 'Unknown'} onChange={() => {}} disabled />
      </FormField>
      <FormField label="Date">
        <TextInput value={createdAt || 'Unknown'} onChange={() => {}} disabled />
      </FormField>
      {(authorTeam || !isAnswer) && (
        <FormField label="Team">
          <TextInput value={authorTeam || 'Unknown'} onChange={() => {}} disabled />
        </FormField>
      )}
      {(authorRole || !isAnswer) && (
        <FormField label="Role">
          <TextInput value={authorRole || 'Unknown'} onChange={() => {}} disabled />
        </FormField>
      )}
      {isReq && (
        <FormField label="Source">
          <TextInput value={req.source} onChange={() => {}} disabled />
        </FormField>
      )}
    </div>
  );
}

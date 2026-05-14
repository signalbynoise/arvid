import { Requirement } from '../../types';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';

interface ClarityTabProps {
  requirement: Requirement;
}

export function ClarityTab({ requirement }: ClarityTabProps) {
  const hasScore = requirement.clarityScore != null;
  const scoreLabel = hasScore
    ? `${requirement.clarityScore}/10 (${requirement.clarity})`
    : requirement.clarity;

  return (
    <div className="p-5 space-y-4">
      <FormField label="Score">
        <TextInput value={scoreLabel} onChange={() => {}} disabled />
      </FormField>

      {requirement.clarityReasoning ? (
        <FormField label="Analysis">
          <TextArea value={requirement.clarityReasoning} onChange={() => {}} disabled />
        </FormField>
      ) : (
        <p className="text-caption-lg text-text-quaternary italic">
          Clarity score not yet computed
        </p>
      )}
    </div>
  );
}

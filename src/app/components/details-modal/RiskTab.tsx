import { Requirement } from '../../types';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';
import { TextArea } from '../ui/TextArea';

interface RiskTabProps {
  requirement: Requirement;
}

export function RiskTab({ requirement }: RiskTabProps) {
  const hasScore = requirement.riskScore != null;
  const scoreLabel = hasScore
    ? `${requirement.riskScore}/10 (${requirement.risk})`
    : requirement.risk;

  return (
    <div className="p-5 space-y-4">
      <FormField label="Score">
        <TextInput value={scoreLabel} onChange={() => {}} disabled />
      </FormField>

      {requirement.riskReasoning ? (
        <FormField label="Analysis">
          <TextArea value={requirement.riskReasoning} onChange={() => {}} disabled />
        </FormField>
      ) : (
        <p className="text-caption-lg text-text-quaternary italic">
          Risk score not yet computed
        </p>
      )}
    </div>
  );
}

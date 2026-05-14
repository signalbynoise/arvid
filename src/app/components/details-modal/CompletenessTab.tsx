import { Requirement } from '../../types';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';

interface CompletenessTabProps {
  requirement: Requirement;
}

export function CompletenessTab({ requirement }: CompletenessTabProps) {
  return (
    <div className="p-5 space-y-4">
      <FormField label="Score">
        <TextInput value={`${requirement.completeness}%`} onChange={() => {}} disabled />
      </FormField>
    </div>
  );
}

import { Question } from '../../types';
import { FormField } from '../ui/FormField';
import { TextInput } from '../ui/TextInput';

interface PropertiesTabProps {
  question: Question;
}

export function PropertiesTab({ question }: PropertiesTabProps) {
  return (
    <div className="p-5 space-y-4">
      <FormField label="Status">
        <TextInput value={question.status} onChange={() => {}} disabled />
      </FormField>
      <FormField label="Importance">
        <TextInput value={question.importance} onChange={() => {}} disabled />
      </FormField>
      <FormField label="Category">
        <TextInput value={question.category} onChange={() => {}} disabled />
      </FormField>
      <FormField label="Type">
        <TextInput value={question.type} onChange={() => {}} disabled />
      </FormField>
    </div>
  );
}

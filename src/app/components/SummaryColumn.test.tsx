import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryColumn } from './SummaryColumn';
import { Requirement, Question } from '../types';

const mockReq: Requirement = {
  id: 'r1',
  title: 'SOC2 Automated Access Review Workflows',
  source: 'User',
  owner: 'Fiona R.',
  completeness: 85,
  clarity: 'High',
  risk: 'Low',
};

const mockQuestions: Question[] = [
  { id: 'q1', requirementId: 'r1', text: 'What tokens?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Scope', author: 'Alice' },
  { id: 'q2', requirementId: 'r1', text: 'Which env?', status: 'Answered', importance: 'Important', type: 'Auto-generated', category: 'Data', author: 'Arvid' },
];

describe('SummaryColumn', () => {
  it('renders the column header', () => {
    render(<SummaryColumn requirement={mockReq} questions={mockQuestions} />);
    expect(screen.getByText('4. Summary')).toBeInTheDocument();
  });

  it('renders with null requirement without crashing', () => {
    render(<SummaryColumn requirement={null} questions={[]} />);
    expect(screen.getByText('4. Summary')).toBeInTheDocument();
  });

  it('shows the requirement title', () => {
    render(<SummaryColumn requirement={mockReq} questions={mockQuestions} />);
    expect(screen.getByText('SOC2 Automated Access Review Workflows')).toBeInTheDocument();
  });

  it('shows the Arvid Specification label', () => {
    render(<SummaryColumn requirement={mockReq} questions={mockQuestions} />);
    expect(screen.getByText('Arvid Specification')).toBeInTheDocument();
  });

  it('shows Knowledge Completeness section', () => {
    render(<SummaryColumn requirement={mockReq} questions={mockQuestions} />);
    expect(screen.getByText('Knowledge Completeness')).toBeInTheDocument();
  });

  it('shows question statistics section', () => {
    render(<SummaryColumn requirement={mockReq} questions={mockQuestions} />);
    expect(screen.getByText('Question Authors')).toBeInTheDocument();
  });
});

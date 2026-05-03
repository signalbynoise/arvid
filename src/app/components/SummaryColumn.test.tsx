import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryColumn } from './SummaryColumn';
import { setStoreState, resetStore } from '../../test/store-utils';
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
  beforeEach(() => {
    resetStore();
  });

  it('renders the column header', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1' });
    render(<SummaryColumn />);
    expect(screen.getByText('4. Summary')).toBeInTheDocument();
  });

  it('renders with no requirement selected without crashing', () => {
    setStoreState({ requirements: [], questions: [], selectedReqId: null });
    render(<SummaryColumn />);
    expect(screen.getByText('4. Summary')).toBeInTheDocument();
  });

  it('shows the requirement title', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1' });
    render(<SummaryColumn />);
    expect(screen.getByText('SOC2 Automated Access Review Workflows')).toBeInTheDocument();
  });

  it('shows the Arvid Specification label', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1' });
    render(<SummaryColumn />);
    expect(screen.getByText('Arvid Specification')).toBeInTheDocument();
  });

  it('shows Knowledge Completeness section', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1' });
    render(<SummaryColumn />);
    expect(screen.getByText('Knowledge Completeness')).toBeInTheDocument();
  });

  it('shows question statistics section', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1' });
    render(<SummaryColumn />);
    expect(screen.getByText('Question Authors')).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryColumn } from './SummaryColumn';
import { setStoreState, resetStore } from '../../test/store-utils';
import { Requirement, Question, Summary } from '../types';

const mockReq: Requirement = {
  id: 'r1',
  shortId: 'R01',
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

const mockSummary: Summary = {
  id: 's1',
  shortId: 'S01',
  requirementId: 'r1',
  synthesis: 'Test synthesis content.',
  coreObjective: 'Test objective content.',
  architecture: 'Test architecture content.',
  constraints: 'Test constraints content.',
  unverifiedRisks: 'Test risks content.',
  completeness: 72,
  completenessReasoning: 'Critical questions about token format remain unanswered.',
  model: 'x-ai/grok-4.1-fast',
};

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

  it('shows the requirement title with summary short ID', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1', summary: mockSummary });
    render(<SummaryColumn />);
    expect(screen.getByText('SOC2 Automated Access Review Workflows')).toBeInTheDocument();
    expect(screen.getByText('S01')).toBeInTheDocument();
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

  it('shows auto-generate message when no summary exists and has questions', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1' });
    render(<SummaryColumn />);
    expect(screen.getByText('Summary will generate automatically...')).toBeInTheDocument();
  });

  it('shows summary content when summary exists', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1', summary: mockSummary });
    render(<SummaryColumn />);
    expect(screen.getByText('Test synthesis content.')).toBeInTheDocument();
    expect(screen.getByText('Test objective content.')).toBeInTheDocument();
  });

  it('shows question authors from real data', () => {
    setStoreState({ requirements: [mockReq], questions: mockQuestions, selectedReqId: 'r1' });
    render(<SummaryColumn />);
    expect(screen.getByText('Question Authors')).toBeInTheDocument();
  });
});

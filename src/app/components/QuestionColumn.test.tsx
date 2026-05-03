import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionColumn } from './QuestionColumn';
import { Question } from '../types';

const questions: Question[] = [
  { id: 'q1', requirementId: 'r1', text: 'What is the scope?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Scope', author: 'Alice' },
  { id: 'q2', requirementId: 'r1', text: 'When is the deadline?', status: 'Answered', importance: 'Important', type: 'Auto-generated', category: 'Time', isSuggested: true, author: 'Arvid' },
  { id: 'q3', requirementId: 'r1', text: 'How much data?', status: 'Conflicting', importance: 'Optional', type: 'Manual', category: 'Data', author: 'Bob' },
];

const defaultProps = {
  questions,
  selectedId: null as string | null,
  onSelect: vi.fn(),
  onUseSuggestion: vi.fn(),
  onHideSuggestion: vi.fn(),
  onOpenDetails: vi.fn(),
};

describe('QuestionColumn', () => {
  it('renders the column header', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getByText('2. Questions')).toBeInTheDocument();
  });

  it('renders all question cards', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getByText('What is the scope?')).toBeInTheDocument();
    expect(screen.getByText('When is the deadline?')).toBeInTheDocument();
    expect(screen.getByText('How much data?')).toBeInTheDocument();
  });

  it('calls onSelect when a question is clicked', () => {
    const onSelect = vi.fn();
    render(<QuestionColumn {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('What is the scope?'));
    expect(onSelect).toHaveBeenCalledWith('q1');
  });

  it('shows status text for non-suggested questions', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getByText('Unanswered')).toBeInTheDocument();
    expect(screen.getByText('Conflicting')).toBeInTheDocument();
  });

  it('shows AI Suggestion label for suggested questions', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
  });

  it('shows Use Question and Hide buttons for suggestions', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getByText('Use Question')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('calls onUseSuggestion when Use Question is clicked', () => {
    const onUseSuggestion = vi.fn();
    render(<QuestionColumn {...defaultProps} onUseSuggestion={onUseSuggestion} />);
    fireEvent.click(screen.getByText('Use Question'));
    expect(onUseSuggestion).toHaveBeenCalledWith('q2');
  });

  it('calls onHideSuggestion when Hide is clicked', () => {
    const onHideSuggestion = vi.fn();
    render(<QuestionColumn {...defaultProps} onHideSuggestion={onHideSuggestion} />);
    fireEvent.click(screen.getByText('Hide'));
    expect(onHideSuggestion).toHaveBeenCalledWith('q2');
  });

  it('filters out hidden questions', () => {
    const questionsWithHidden: Question[] = [
      ...questions,
      { id: 'q4', requirementId: 'r1', text: 'Hidden question', status: 'Unanswered', importance: 'Optional', type: 'Manual', category: 'Scope', isHidden: true },
    ];
    render(<QuestionColumn {...defaultProps} questions={questionsWithHidden} />);
    expect(screen.queryByText('Hidden question')).not.toBeInTheDocument();
  });

  it('shows empty state when no questions', () => {
    render(<QuestionColumn {...defaultProps} questions={[]} />);
    expect(screen.getByText(/No questions yet/)).toBeInTheDocument();
  });

  it('shows category labels on question cards', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('shows author names on non-suggested questions', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows Arvid as author for suggested questions', () => {
    render(<QuestionColumn {...defaultProps} />);
    expect(screen.getAllByText('Arvid').length).toBeGreaterThan(0);
  });

  it('dims non-selected questions when one is selected', () => {
    render(<QuestionColumn {...defaultProps} selectedId="q1" />);
    const card = screen.getByText('How much data?').closest('[class*="opacity"]');
    expect(card?.className).toContain('opacity-30');
  });

  it('does not call onSelect for suggested questions', () => {
    const onSelect = vi.fn();
    render(<QuestionColumn {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('When is the deadline?'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

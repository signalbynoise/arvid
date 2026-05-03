import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionColumn } from './QuestionColumn';
import { setStoreState, resetStore } from '../../test/store-utils';
import { useStore } from '../store';
import { Question } from '../types';

const questions: Question[] = [
  { id: 'q1', requirementId: 'r1', text: 'What is the scope?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Scope', author: 'Alice' },
  { id: 'q2', requirementId: 'r1', text: 'When is the deadline?', status: 'Answered', importance: 'Important', type: 'Auto-generated', category: 'Time', isSuggested: true, author: 'Arvid' },
  { id: 'q3', requirementId: 'r1', text: 'How much data?', status: 'Conflicting', importance: 'Optional', type: 'Manual', category: 'Data', author: 'Bob' },
];

describe('QuestionColumn', () => {
  beforeEach(() => {
    resetStore();
    setStoreState({ questions, selectedReqId: 'r1' });
  });

  it('renders the column header', () => {
    render(<QuestionColumn />);
    expect(screen.getByText('2. Questions')).toBeInTheDocument();
  });

  it('renders all question cards', () => {
    render(<QuestionColumn />);
    expect(screen.getByText('What is the scope?')).toBeInTheDocument();
    expect(screen.getByText('When is the deadline?')).toBeInTheDocument();
    expect(screen.getByText('How much data?')).toBeInTheDocument();
  });

  it('selects question when clicked', () => {
    render(<QuestionColumn />);
    fireEvent.click(screen.getByText('What is the scope?'));
    expect(useStore.getState().selectedQuestionId).toBe('q1');
  });

  it('shows status text for non-suggested questions', () => {
    render(<QuestionColumn />);
    expect(screen.getByText('Unanswered')).toBeInTheDocument();
    expect(screen.getByText('Conflicting')).toBeInTheDocument();
  });

  it('shows AI Suggestion label for suggested questions', () => {
    render(<QuestionColumn />);
    expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
  });

  it('shows Use Question and Hide buttons for suggestions', () => {
    render(<QuestionColumn />);
    expect(screen.getByText('Use Question')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('filters out hidden questions', () => {
    const questionsWithHidden: Question[] = [
      ...questions,
      { id: 'q4', requirementId: 'r1', text: 'Hidden question', status: 'Unanswered', importance: 'Optional', type: 'Manual', category: 'Scope', isHidden: true },
    ];
    setStoreState({ questions: questionsWithHidden, selectedReqId: 'r1' });
    render(<QuestionColumn />);
    expect(screen.queryByText('Hidden question')).not.toBeInTheDocument();
  });

  it('shows empty state when no questions', () => {
    setStoreState({ questions: [], selectedReqId: 'r1' });
    render(<QuestionColumn />);
    expect(screen.getByText(/No questions yet/)).toBeInTheDocument();
  });

  it('shows category labels on question cards', () => {
    render(<QuestionColumn />);
    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('shows author names on non-suggested questions', () => {
    render(<QuestionColumn />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows Arvid as author for suggested questions', () => {
    render(<QuestionColumn />);
    expect(screen.getAllByText('Arvid').length).toBeGreaterThan(0);
  });

  it('dims non-selected questions when one is selected', () => {
    setStoreState({ questions, selectedReqId: 'r1', selectedQuestionId: 'q1' });
    render(<QuestionColumn />);
    const card = screen.getByText('How much data?').closest('[class*="opacity"]');
    expect(card?.className).toContain('opacity-30');
  });

  it('does not select suggested questions on click', () => {
    render(<QuestionColumn />);
    fireEvent.click(screen.getByText('When is the deadline?'));
    expect(useStore.getState().selectedQuestionId).toBeNull();
  });
});

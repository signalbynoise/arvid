import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnswerColumn } from './AnswerColumn';
import { setStoreState, resetStore } from '../../test/store-utils';
import { useStore } from '../store';
import { Answer } from '../types';

vi.mock('../api', () => ({
  api: {
    updateAnswer: vi.fn().mockResolvedValue({}),
    updateQuestion: vi.fn().mockResolvedValue({}),
  },
}));

const answers: Answer[] = [
  { id: 'a1', questionId: 'q1', text: 'This is the first answer.', author: 'Alice', date: '2026-01-15', isCurrent: true },
  { id: 'a2', questionId: 'q1', text: 'This is an alternative answer.', author: 'Bob', date: '2026-01-10', isCurrent: false },
];

describe('AnswerColumn', () => {
  beforeEach(() => {
    resetStore();
    setStoreState({ answers, selectedQuestionId: 'q1' });
  });

  it('renders the column header', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('3. Answers')).toBeInTheDocument();
  });

  it('renders answer cards', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('This is the first answer.')).toBeInTheDocument();
    expect(screen.getByText('This is an alternative answer.')).toBeInTheDocument();
  });

  it('shows author names', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty state when no answers', () => {
    setStoreState({ answers: [], selectedQuestionId: 'q1' });
    render(<AnswerColumn />);
    expect(screen.getByText(/No answers yet/)).toBeInTheDocument();
  });

  it('shows Active Answer button for current answer', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('Active Answer')).toBeInTheDocument();
  });

  it('shows Mark Active button for non-current answer', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('Mark Active')).toBeInTheDocument();
  });

  it('toggles answer current status when button clicked', () => {
    render(<AnswerColumn />);
    fireEvent.click(screen.getByText('Active Answer'));
    const state = useStore.getState();
    const updated = state.answers.find((a: Answer) => a.id === 'a1');
    expect(updated?.isCurrent).toBe(false);
  });

  it('shows select question message when no question is selected', () => {
    setStoreState({ answers, selectedQuestionId: null });
    render(<AnswerColumn />);
    expect(screen.getByText(/Select a question/)).toBeInTheDocument();
  });

  it('shows dates on answer cards', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    expect(screen.getByText('2026-01-10')).toBeInTheDocument();
  });

  it('renders answer text content', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('This is the first answer.')).toBeInTheDocument();
    expect(screen.getByText('This is an alternative answer.')).toBeInTheDocument();
  });
});

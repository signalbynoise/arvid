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
    suggestAnswer: vi.fn().mockResolvedValue({ skipped: true, reasoning: 'test' }),
  },
}));

const answers: Answer[] = [
  { id: 'a1', shortId: 'A01', questionId: 'q1', text: 'This is the first answer.', author: 'Alice', date: '2026-01-15', isCurrent: true },
  { id: 'a2', shortId: 'A02', questionId: 'q1', text: 'This is an alternative answer.', author: 'Bob', date: '2026-01-10', isCurrent: false },
];

const suggestedAnswer: Answer = {
  id: 'as-q1-1',
  questionId: 'q1',
  text: 'AI suggests using OAuth2 with PKCE.',
  author: 'Arvid',
  date: '2026-05-04',
  isCurrent: false,
  isSuggested: true,
  isHidden: false,
};

const hiddenSuggestedAnswer: Answer = {
  id: 'as-q1-2',
  questionId: 'q1',
  text: 'This was hidden.',
  author: 'Arvid',
  date: '2026-05-04',
  isCurrent: false,
  isSuggested: true,
  isHidden: true,
};

describe('AnswerColumn', () => {
  beforeEach(() => {
    resetStore();
    setStoreState({ answers, selectedQuestionId: 'q1' });
  });

  it('renders the column header', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('3. Answers')).toBeInTheDocument();
  });

  it('renders answer cards with short IDs', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('This is the first answer.')).toBeInTheDocument();
    expect(screen.getByText('This is an alternative answer.')).toBeInTheDocument();
    expect(screen.getByText('A01')).toBeInTheDocument();
    expect(screen.getByText('A02')).toBeInTheDocument();
  });

  it('shows author names', () => {
    render(<AnswerColumn />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty state when no answers, no suggestions, and not suggesting', () => {
    setStoreState({ answers: [], selectedQuestionId: null });
    render(<AnswerColumn />);
    expect(screen.getByText(/Select a question/)).toBeInTheDocument();
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

  it('renders suggested answers with AI Suggestion treatment', () => {
    setStoreState({ answers: [...answers, suggestedAnswer], selectedQuestionId: 'q1' });
    render(<AnswerColumn />);
    expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
    expect(screen.getByText('AI suggests using OAuth2 with PKCE.')).toBeInTheDocument();
    expect(screen.getByText('Use Answer')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('does not render hidden suggested answers', () => {
    setStoreState({ answers: [...answers, hiddenSuggestedAnswer], selectedQuestionId: 'q1' });
    render(<AnswerColumn />);
    expect(screen.queryByText('This was hidden.')).not.toBeInTheDocument();
  });

  it('separates suggested answers from regular answers', () => {
    setStoreState({ answers: [...answers, suggestedAnswer], selectedQuestionId: 'q1' });
    render(<AnswerColumn />);
    expect(screen.getByText('This is the first answer.')).toBeInTheDocument();
    expect(screen.getByText('AI suggests using OAuth2 with PKCE.')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnswerColumn } from './AnswerColumn';
import { Answer } from '../types';

const answers: Answer[] = [
  { id: 'a1', questionId: 'q1', text: 'This is the first answer.', author: 'Alice', date: '2026-01-15', isCurrent: true },
  { id: 'a2', questionId: 'q1', text: 'This is an alternative answer.', author: 'Bob', date: '2026-01-10', isCurrent: false },
];

const defaultProps = {
  answers,
  questionSelected: true,
  onToggleCurrent: vi.fn(),
};

describe('AnswerColumn', () => {
  it('renders the column header', () => {
    render(<AnswerColumn {...defaultProps} />);
    expect(screen.getByText('3. Answers')).toBeInTheDocument();
  });

  it('renders answer cards', () => {
    render(<AnswerColumn {...defaultProps} />);
    expect(screen.getByText('This is the first answer.')).toBeInTheDocument();
    expect(screen.getByText('This is an alternative answer.')).toBeInTheDocument();
  });

  it('shows author names', () => {
    render(<AnswerColumn {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty state when no answers', () => {
    render(<AnswerColumn {...defaultProps} answers={[]} />);
    expect(screen.getByText(/No answers yet/)).toBeInTheDocument();
  });

  it('shows Active Answer button for current answer', () => {
    render(<AnswerColumn {...defaultProps} />);
    expect(screen.getByText('Active Answer')).toBeInTheDocument();
  });

  it('shows Mark Active button for non-current answer', () => {
    render(<AnswerColumn {...defaultProps} />);
    expect(screen.getByText('Mark Active')).toBeInTheDocument();
  });

  it('calls onToggleCurrent when toggle button is clicked', () => {
    const onToggleCurrent = vi.fn();
    render(<AnswerColumn {...defaultProps} onToggleCurrent={onToggleCurrent} />);
    fireEvent.click(screen.getByText('Active Answer'));
    expect(onToggleCurrent).toHaveBeenCalledWith('a1');
  });

  it('shows select question message when no question is selected', () => {
    render(<AnswerColumn {...defaultProps} questionSelected={false} />);
    expect(screen.getByText(/Select a question/)).toBeInTheDocument();
  });

  it('shows dates on answer cards', () => {
    render(<AnswerColumn {...defaultProps} />);
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    expect(screen.getByText('2026-01-10')).toBeInTheDocument();
  });

  it('renders answer text content', () => {
    render(<AnswerColumn {...defaultProps} />);
    expect(screen.getByText('This is the first answer.')).toBeInTheDocument();
    expect(screen.getByText('This is an alternative answer.')).toBeInTheDocument();
  });
});

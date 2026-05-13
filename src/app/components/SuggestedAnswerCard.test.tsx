import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestedAnswerCard } from './SuggestedAnswerCard';
import { Answer } from '../types';

const suggestedAnswer: Answer = {
  id: 'as-q1-1714854000000',
  questionId: 'q1',
  text: 'Best practice suggests using OAuth2 with PKCE for SPAs.',
  author: 'Arvid',
  createdAt: '2026-05-04T00:00:00.000Z',
  isCurrent: false,
  isSuggested: true,
  isHidden: false,
};

describe('SuggestedAnswerCard', () => {
  it('renders the AI Suggestion pill', () => {
    render(<SuggestedAnswerCard answer={suggestedAnswer} onUse={vi.fn()} onHide={vi.fn()} />);
    expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
  });

  it('renders the answer text', () => {
    render(<SuggestedAnswerCard answer={suggestedAnswer} onUse={vi.fn()} onHide={vi.fn()} />);
    expect(screen.getByText(suggestedAnswer.text)).toBeInTheDocument();
  });

  it('renders Arvid as author', () => {
    render(<SuggestedAnswerCard answer={suggestedAnswer} onUse={vi.fn()} onHide={vi.fn()} />);
    expect(screen.getByText('Arvid')).toBeInTheDocument();
  });

  it('renders Use Answer and Hide buttons', () => {
    render(<SuggestedAnswerCard answer={suggestedAnswer} onUse={vi.fn()} onHide={vi.fn()} />);
    expect(screen.getByText('Use Answer')).toBeInTheDocument();
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  it('calls onUse when Use Answer is clicked', () => {
    const onUse = vi.fn();
    render(<SuggestedAnswerCard answer={suggestedAnswer} onUse={onUse} onHide={vi.fn()} />);
    fireEvent.click(screen.getByText('Use Answer'));
    expect(onUse).toHaveBeenCalledWith(suggestedAnswer.id);
  });

  it('calls onHide when Hide is clicked', () => {
    const onHide = vi.fn();
    render(<SuggestedAnswerCard answer={suggestedAnswer} onUse={vi.fn()} onHide={onHide} />);
    fireEvent.click(screen.getByText('Hide'));
    expect(onHide).toHaveBeenCalledWith(suggestedAnswer.id);
  });

  it('renders the date', () => {
    render(<SuggestedAnswerCard answer={suggestedAnswer} onUse={vi.fn()} onHide={vi.fn()} />);
    expect(screen.getByText('2026-05-04T00:00:00.000Z')).toBeInTheDocument();
  });
});

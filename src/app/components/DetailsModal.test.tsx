import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailsModal } from './DetailsModal';
import { Requirement, Question } from '../types';

const mockReq: Requirement = {
  id: 'r1',
  title: 'Test Requirement',
  source: 'User',
  owner: 'Alice',
  ownerTeam: 'Engineering',
  ownerRole: 'Lead',
  createdAt: '2026-01-15',
  description: 'This is a test requirement description.',
  completeness: 80,
  clarity: 'High',
  risk: 'Low',
};

const mockQuestion: Question = {
  id: 'q1',
  requirementId: 'r1',
  text: 'How does this work?',
  status: 'Unanswered',
  importance: 'Critical',
  type: 'Manual',
  category: 'Scope',
  author: 'Bob',
  authorTeam: 'Product',
  authorRole: 'PM',
  createdAt: '2026-02-01',
  description: 'Need clarification on the approach.',
};

describe('DetailsModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DetailsModal isOpen={false} onClose={vi.fn()} type="requirement" data={mockReq} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when data is null', () => {
    const { container } = render(
      <DetailsModal isOpen={true} onClose={vi.fn()} type="requirement" data={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when type is null', () => {
    const { container } = render(
      <DetailsModal isOpen={true} onClose={vi.fn()} type={null} data={mockReq} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders requirement details when type is requirement', () => {
    render(<DetailsModal isOpen={true} onClose={vi.fn()} type="requirement" data={mockReq} />);
    expect(screen.getByText('Requirement Details')).toBeInTheDocument();
    expect(screen.getByText('Test Requirement')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    expect(screen.getByText('This is a test requirement description.')).toBeInTheDocument();
  });

  it('renders question details when type is question', () => {
    render(<DetailsModal isOpen={true} onClose={vi.fn()} type="question" data={mockQuestion} />);
    expect(screen.getByText('Question Details')).toBeInTheDocument();
    expect(screen.getByText('How does this work?')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();
    expect(screen.getByText('Need clarification on the approach.')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<DetailsModal isOpen={true} onClose={onClose} type="requirement" data={mockReq} />);
    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

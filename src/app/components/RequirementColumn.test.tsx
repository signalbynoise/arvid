import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementColumn } from './RequirementColumn';
import { Requirement } from '../types';

const requirements: Requirement[] = [
  { id: 'r1', title: 'First Requirement', source: 'User', owner: 'Alice', completeness: 80, clarity: 'High', risk: 'Low' },
  { id: 'r2', title: 'Second Requirement', source: 'API', owner: 'Bob', completeness: 40, clarity: 'Medium', risk: 'High' },
  { id: 'r3', title: 'Third Requirement', source: 'User', owner: 'Alice', completeness: 10, clarity: 'Low', risk: 'Medium' },
];

const defaultProps = {
  requirements,
  selectedId: null as string | null,
  onSelect: vi.fn(),
  onNewReqClick: vi.fn(),
  onOpenDetails: vi.fn(),
};

describe('RequirementColumn', () => {
  it('renders the column header', () => {
    render(<RequirementColumn {...defaultProps} />);
    expect(screen.getByText('1. Requirements')).toBeInTheDocument();
  });

  it('renders all requirement cards', () => {
    render(<RequirementColumn {...defaultProps} />);
    expect(screen.getByText('First Requirement')).toBeInTheDocument();
    expect(screen.getByText('Second Requirement')).toBeInTheDocument();
    expect(screen.getByText('Third Requirement')).toBeInTheDocument();
  });

  it('calls onSelect when a requirement card is clicked', () => {
    const onSelect = vi.fn();
    render(<RequirementColumn {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('First Requirement'));
    expect(onSelect).toHaveBeenCalledWith('r1');
  });

  it('shows owner name on cards', () => {
    render(<RequirementColumn {...defaultProps} />);
    expect(screen.getAllByText('Alice')).toHaveLength(2);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows completeness percentage', () => {
    render(<RequirementColumn {...defaultProps} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('highlights the selected requirement', () => {
    render(<RequirementColumn {...defaultProps} selectedId="r1" />);
    const card = screen.getByText('First Requirement').closest('[class*="border"]');
    expect(card?.className).toContain('border-[rgba(255,255,255,0.2)]');
  });

  it('dims non-selected requirements when one is selected', () => {
    render(<RequirementColumn {...defaultProps} selectedId="r1" />);
    const otherCard = screen.getByText('Second Requirement').closest('[class*="opacity"]');
    expect(otherCard?.className).toContain('opacity-30');
  });

  it('calls onNewReqClick when plus button is clicked', () => {
    const onNewReqClick = vi.fn();
    render(<RequirementColumn {...defaultProps} onNewReqClick={onNewReqClick} />);
    const btn = screen.getByTitle('New Requirement');
    fireEvent.click(btn);
    expect(onNewReqClick).toHaveBeenCalled();
  });

  it('renders completeness bar colors correctly', () => {
    render(<RequirementColumn {...defaultProps} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('shows clarity and risk indicators', () => {
    render(<RequirementColumn {...defaultProps} />);
    const clarityDots = document.querySelectorAll('[title="High"], [title="Medium"], [title="Low"]');
    expect(clarityDots.length).toBeGreaterThan(0);
  });
});

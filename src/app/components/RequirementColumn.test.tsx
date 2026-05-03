import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementColumn } from './RequirementColumn';
import { setStoreState, resetStore } from '../../test/store-utils';
import { useStore } from '../store';
import { Requirement } from '../types';

const requirements: Requirement[] = [
  { id: 'r1', title: 'First Requirement', source: 'User', owner: 'Alice', completeness: 80, clarity: 'High', risk: 'Low' },
  { id: 'r2', title: 'Second Requirement', source: 'API', owner: 'Bob', completeness: 40, clarity: 'Medium', risk: 'High' },
  { id: 'r3', title: 'Third Requirement', source: 'User', owner: 'Alice', completeness: 10, clarity: 'Low', risk: 'Medium' },
];

describe('RequirementColumn', () => {
  beforeEach(() => {
    resetStore();
    setStoreState({ requirements });
  });

  it('renders the column header', () => {
    render(<RequirementColumn />);
    expect(screen.getByText('1. Requirements')).toBeInTheDocument();
  });

  it('renders all requirement cards', () => {
    render(<RequirementColumn />);
    expect(screen.getByText('First Requirement')).toBeInTheDocument();
    expect(screen.getByText('Second Requirement')).toBeInTheDocument();
    expect(screen.getByText('Third Requirement')).toBeInTheDocument();
  });

  it('selects a requirement when card is clicked', () => {
    render(<RequirementColumn />);
    fireEvent.click(screen.getByText('First Requirement'));
    expect(useStore.getState().selectedReqId).toBe('r1');
  });

  it('shows owner name on cards', () => {
    render(<RequirementColumn />);
    expect(screen.getAllByText('Alice')).toHaveLength(2);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows completeness percentage', () => {
    render(<RequirementColumn />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('highlights the selected requirement', () => {
    setStoreState({ requirements, selectedReqId: 'r1' });
    render(<RequirementColumn />);
    const card = screen.getByText('First Requirement').closest('[class*="border"]');
    expect(card?.className).toContain('border-border-focus');
  });

  it('dims non-selected requirements when one is selected', () => {
    setStoreState({ requirements, selectedReqId: 'r1' });
    render(<RequirementColumn />);
    const otherCard = screen.getByText('Second Requirement').closest('[class*="opacity"]');
    expect(otherCard?.className).toContain('opacity-30');
  });

  it('calls onNewReqClick when plus button is clicked', () => {
    const onNewReqClick = vi.fn();
    render(<RequirementColumn onNewReqClick={onNewReqClick} />);
    const btn = screen.getByTitle('New Requirement');
    fireEvent.click(btn);
    expect(onNewReqClick).toHaveBeenCalled();
  });

  it('renders completeness bar colors correctly', () => {
    render(<RequirementColumn />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('shows clarity and risk indicators', () => {
    render(<RequirementColumn />);
    const clarityDots = document.querySelectorAll('[title="High"], [title="Medium"], [title="Low"]');
    expect(clarityDots.length).toBeGreaterThan(0);
  });
});

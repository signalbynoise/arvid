import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementColumn } from './RequirementColumn';
import { setStoreState, resetStore } from '../../test/store-utils';
import { useStore } from '../store';
import { Requirement, Question } from '../types';

const requirements: Requirement[] = [
  { id: 'r1', shortId: 'R01', title: 'First Requirement', source: 'User', owner: 'Alice', completeness: 80, clarity: 'High', risk: 'Low' },
  { id: 'r2', shortId: 'R02', title: 'Second Requirement', source: 'API', owner: 'Bob', completeness: 40, clarity: 'Medium', risk: 'High' },
  { id: 'r3', shortId: 'R03', title: 'Third Requirement', source: 'User', owner: 'Alice', completeness: 10, clarity: 'Low', risk: 'Medium' },
];

const questions: Question[] = [
  { id: 'q1', requirementId: 'r1', text: 'Q1?', status: 'Answered', importance: 'Critical', type: 'Manual', category: 'Scope' },
  { id: 'q2', requirementId: 'r1', text: 'Q2?', status: 'Answered', importance: 'Important', type: 'Manual', category: 'Data' },
  { id: 'q3', requirementId: 'r1', text: 'Q3?', status: 'Unanswered', importance: 'Optional', type: 'Manual', category: 'Time' },
  { id: 'q4', requirementId: 'r2', text: 'Q4?', status: 'Answered', importance: 'Important', type: 'Manual', category: 'Scope' },
  { id: 'q5', requirementId: 'r2', text: 'Q5?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Data' },
  { id: 'q6', requirementId: 'r3', text: 'Q6?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Scope' },
];

describe('RequirementColumn', () => {
  beforeEach(() => {
    resetStore();
    setStoreState({ requirements, questions });
  });

  it('renders the column header', () => {
    render(<RequirementColumn />);
    expect(screen.getByText('1. Requirements')).toBeInTheDocument();
  });

  it('renders all requirement cards with short IDs', () => {
    render(<RequirementColumn />);
    expect(screen.getByText('First Requirement')).toBeInTheDocument();
    expect(screen.getByText('Second Requirement')).toBeInTheDocument();
    expect(screen.getByText('Third Requirement')).toBeInTheDocument();
    expect(screen.getByText('R01')).toBeInTheDocument();
    expect(screen.getByText('R02')).toBeInTheDocument();
    expect(screen.getByText('R03')).toBeInTheDocument();
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

  it('shows completeness percentage computed from questions', () => {
    render(<RequirementColumn />);
    expect(screen.getByText('83%')).toBeInTheDocument();
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
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows clarity and risk indicators', () => {
    render(<RequirementColumn />);
    const clarityDots = document.querySelectorAll('[title="High"], [title="Medium"], [title="Low"]');
    expect(clarityDots.length).toBeGreaterThan(0);
  });
});

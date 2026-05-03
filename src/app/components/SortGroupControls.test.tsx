import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SortGroupControls } from './SortGroupControls';

const defaultProps = {
  groupByOptions: [
    { label: 'None', value: 'none' },
    { label: 'Category', value: 'category' },
  ],
  sortByOptions: [
    { label: 'Default', value: 'default' },
    { label: 'Name', value: 'name' },
  ],
  currentGroup: 'none',
  currentSort: 'default',
  onGroupChange: vi.fn(),
  onSortChange: vi.fn(),
};

describe('SortGroupControls', () => {
  it('renders group and sort icon buttons', () => {
    render(<SortGroupControls {...defaultProps} />);
    expect(screen.getByTitle('Group by')).toBeInTheDocument();
    expect(screen.getByTitle('Sort by')).toBeInTheDocument();
  });

  it('renders both trigger buttons as interactive elements', () => {
    render(<SortGroupControls {...defaultProps} />);
    const groupBtn = screen.getByTitle('Group by');
    const sortBtn = screen.getByTitle('Sort by');
    expect(groupBtn).not.toBeDisabled();
    expect(sortBtn).not.toBeDisabled();
  });
});

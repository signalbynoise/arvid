import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders children', () => {
    render(<IconButton><span data-testid="icon">X</span></IconButton>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IconButton onClick={onClick}>Click</IconButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes title attribute', () => {
    render(<IconButton title="Add item">+</IconButton>);
    expect(screen.getByTitle('Add item')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    render(<IconButton className="custom-class">X</IconButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('has the base styling classes', () => {
    render(<IconButton>X</IconButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('p-1');
    expect(btn).toHaveClass('rounded-standard');
    expect(btn).toHaveClass('transition-colors');
  });
});

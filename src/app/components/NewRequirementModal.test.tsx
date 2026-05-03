import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequirementModal } from './NewRequirementModal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onCreate: vi.fn(),
};

describe('NewRequirementModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NewRequirementModal isOpen={false} onClose={vi.fn()} onCreate={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when open', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('New Requirement')).toBeInTheDocument();
  });

  it('shows the write step by default with textarea', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Describe the requirement in plain text...')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<NewRequirementModal {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(btn => btn.querySelector('svg'));
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onCreate when Create is clicked with text', () => {
    const onCreate = vi.fn();
    const onClose = vi.fn();
    render(<NewRequirementModal {...defaultProps} onCreate={onCreate} onClose={onClose} />);

    const textarea = screen.getByPlaceholderText('Describe the requirement in plain text...');
    fireEvent.change(textarea, { target: { value: 'My new requirement' } });

    const submitBtn = screen.getByText('Create');
    fireEvent.click(submitBtn);
    expect(onCreate).toHaveBeenCalledWith('My new requirement');
  });

  it('does not call onCreate when Create is clicked without text', () => {
    const onCreate = vi.fn();
    render(<NewRequirementModal {...defaultProps} onCreate={onCreate} />);
    const submitBtn = screen.getByText('Create');
    fireEvent.click(submitBtn);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('shows source import options (Files, Email, Slack)', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Slack')).toBeInTheDocument();
  });

  it('navigates to file upload step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Files'));
    expect(screen.getByText('Import from Files')).toBeInTheDocument();
    expect(screen.getByText(/drag files here/i)).toBeInTheDocument();
  });

  it('navigates to email import step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Email'));
    expect(screen.getByText('Import from Email')).toBeInTheDocument();
    expect(screen.getByText('Connect Gmail')).toBeInTheDocument();
  });

  it('navigates to slack import step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Slack'));
    expect(screen.getByText('Import from Slack')).toBeInTheDocument();
    expect(screen.getByText('Connect Slack')).toBeInTheDocument();
  });

  it('shows Enhance button when text is entered', () => {
    render(<NewRequirementModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Describe the requirement in plain text...');
    fireEvent.change(textarea, { target: { value: 'Some text' } });
    expect(screen.getByText('Enhance')).toBeInTheDocument();
  });

  it('back button returns to write step from file upload', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Files'));
    expect(screen.getByText('Import from Files')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('New Requirement')).toBeInTheDocument();
  });

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn();
    render(<NewRequirementModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

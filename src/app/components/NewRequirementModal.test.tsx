import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequirementModal } from './NewRequirementModal';
import { resetStore } from '../../test/store-utils';

vi.mock('../api', () => ({
  api: {
    createRequirement: vi.fn().mockResolvedValue({ id: 'r-new', title: 'My new requirement', source: 'User', owner: 'Unassigned', completeness: 0, clarity: 'Low', risk: 'Medium' }),
    enhanceRequirement: vi.fn().mockResolvedValue({ title: 'Enhanced Title', description: 'Enhanced description text.' }),
    suggestQuestions: vi.fn().mockResolvedValue([]),
  },
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
};

describe('NewRequirementModal', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NewRequirementModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when open', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('New Requirement')).toBeInTheDocument();
  });

  it('shows the write step by default with textarea', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Describe what needs to be built in plain text...')).toBeInTheDocument();
  });

  it('shows Check with Arvid button on write step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('Check with Arvid')).toBeInTheDocument();
  });

  it('Check with Arvid button is disabled without text', () => {
    render(<NewRequirementModal {...defaultProps} />);
    const btn = screen.getByText('Check with Arvid').closest('button');
    expect(btn).toBeDisabled();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<NewRequirementModal {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(btn => btn.querySelector('svg'));
    fireEvent.click(closeBtn!);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows external source import options', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('Process from documents')).toBeInTheDocument();
    expect(screen.getByText('Process from Gmail')).toBeInTheDocument();
    expect(screen.getByText('Process from Slack')).toBeInTheDocument();
  });

  it('navigates to file upload step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process from documents'));
    expect(screen.getByText('Import from Files')).toBeInTheDocument();
    expect(screen.getByText(/drag files here/i)).toBeInTheDocument();
  });

  it('navigates to email import step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process from Gmail'));
    expect(screen.getByText('Import from Email')).toBeInTheDocument();
    expect(screen.getByText('Connect Gmail')).toBeInTheDocument();
  });

  it('navigates to slack import step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process from Slack'));
    expect(screen.getByText('Import from Slack')).toBeInTheDocument();
    expect(screen.getByText('Connect Slack')).toBeInTheDocument();
  });

  it('back button returns to write step from file upload', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process from documents'));
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

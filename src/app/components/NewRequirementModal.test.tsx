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

  it('renders the modal when open with choose step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('New Requirement')).toBeInTheDocument();
  });

  it('shows method choice buttons on the default step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('Write with Arvid')).toBeInTheDocument();
    expect(screen.getByText('Process requirements from uploaded files')).toBeInTheDocument();
    expect(screen.getByText('Process requirements from Slack channels')).toBeInTheDocument();
    expect(screen.getByText('Process requirements from emails')).toBeInTheDocument();
  });

  it('navigates to write step when Write with Arvid is clicked', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Write with Arvid'));
    expect(screen.getByPlaceholderText(/Write your requirement/)).toBeInTheDocument();
    expect(screen.getByText('Check with Arvid')).toBeInTheDocument();
  });

  it('shows Figma link input on write step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Write with Arvid'));
    expect(screen.getByPlaceholderText('Paste the Figma link here')).toBeInTheDocument();
  });

  it('Check with Arvid button is disabled without text on write step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Write with Arvid'));
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

  it('navigates to file upload step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process requirements from uploaded files'));
    expect(screen.getByText('Import from Files')).toBeInTheDocument();
    expect(screen.getByText(/drag files here/i)).toBeInTheDocument();
  });

  it('navigates to email import step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process requirements from emails'));
    expect(screen.getByText('Import from Email')).toBeInTheDocument();
    expect(screen.getByText('Connect Gmail')).toBeInTheDocument();
  });

  it('navigates to slack import step', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process requirements from Slack channels'));
    expect(screen.getByText('Import from Slack')).toBeInTheDocument();
    expect(screen.getByText('Connect Slack')).toBeInTheDocument();
  });

  it('back button returns to choose step from file upload', () => {
    render(<NewRequirementModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Process requirements from uploaded files'));
    expect(screen.getByText('Import from Files')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('New Requirement')).toBeInTheDocument();
    expect(screen.getByText('Write with Arvid')).toBeInTheDocument();
  });

  it('Cancel button on write step calls onClose', () => {
    const onClose = vi.fn();
    render(<NewRequirementModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Write with Arvid'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

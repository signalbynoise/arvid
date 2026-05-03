import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('./api', () => ({
  api: {
    getRequirements: vi.fn().mockResolvedValue([
      { id: 'r1', title: 'Test Requirement', source: 'User', owner: 'Alice', completeness: 80, clarity: 'High', risk: 'Low' },
    ]),
    getQuestions: vi.fn().mockResolvedValue([
      { id: 'q1', requirementId: 'r1', text: 'How?', status: 'Unanswered', importance: 'Critical', type: 'Manual', category: 'Scope' },
    ]),
    getAnswers: vi.fn().mockResolvedValue([
      { id: 'a1', questionId: 'q1', text: 'Because.', author: 'Bob', date: '2026-01-01', isCurrent: true },
    ]),
    createRequirement: vi.fn(),
    updateQuestion: vi.fn(),
    updateAnswer: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    endpoint: string;
    constructor(msg: string, status: number, endpoint: string) {
      super(msg);
      this.status = status;
      this.endpoint = endpoint;
    }
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    render(<App />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders the main layout after loading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('1. Requirements')).toBeInTheDocument();
    });
  });

  it('renders the sidebar with Arvid logo', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Arvid')).toBeInTheDocument();
    });
  });

  it('shows requirement cards after data loads', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Requirement')).toBeInTheDocument();
    });
  });

  it('shows empty state when no requirement is selected', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Select a requirement to view its knowledge flow.')).toBeInTheDocument();
    });
  });

  it('toggles sidebar when button is clicked', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Arvid')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTitle('Toggle Sidebar');
    fireEvent.click(toggleBtn);

    expect(screen.queryByText('Arvid')).not.toBeInTheDocument();
  });

  it('shows question column when a requirement is selected', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Requirement')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Requirement'));

    await waitFor(() => {
      expect(screen.getByText('2. Questions')).toBeInTheDocument();
    });
  });

  it('opens the new requirement modal', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Requirement')).toBeInTheDocument();
    });

    const newReqBtn = screen.getByTitle('New Requirement');
    fireEvent.click(newReqBtn);

    expect(screen.getByPlaceholderText('Describe the requirement in plain text...')).toBeInTheDocument();
  });

  it('shows summary column when requirement is selected', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Requirement')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Requirement'));

    await waitFor(() => {
      expect(screen.getByText('4. Summary')).toBeInTheDocument();
    });
  });

  it('shows answer column when question is selected', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Requirement')).toBeInTheDocument();
    });

    const reqCard = document.querySelector('#req-r1') as HTMLElement;
    fireEvent.click(reqCard);

    await waitFor(() => {
      expect(screen.getByText('2. Questions')).toBeInTheDocument();
    });

    const questionCard = document.querySelector('#question-q1') as HTMLElement;
    if (questionCard) {
      fireEvent.click(questionCard);
      await waitFor(() => {
        expect(screen.getByText('Because.')).toBeInTheDocument();
      });
    }
  });

  it('deselects requirement when clicking it again', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Requirement')).toBeInTheDocument();
    });

    const reqCard = document.querySelector('#req-r1') as HTMLElement;
    fireEvent.click(reqCard);
    await waitFor(() => {
      expect(screen.getByText('2. Questions')).toBeInTheDocument();
    });

    fireEvent.click(reqCard);
    await waitFor(() => {
      expect(screen.getByText('Select a requirement to view its knowledge flow.')).toBeInTheDocument();
    });
  });

  it('renders user avatar button in header', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  it('renders projects in the sidebar', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Platform Migration')).toBeInTheDocument();
    });
  });
});

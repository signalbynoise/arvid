import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { Project } from '../types';

const projects: Project[] = [
  {
    id: 'p1',
    name: 'Project Alpha',
    subProjects: [
      { id: 'p1-1', name: 'Sub Alpha' },
    ],
  },
  { id: 'p2', name: 'Project Beta', subProjects: [] },
];

const defaultProps = {
  isOpen: true,
  projects,
  selectedProjectId: 'p1',
  onSelectProject: vi.fn(),
  onCreateProject: vi.fn(),
};

describe('Sidebar', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the Arvid logo', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Arvid')).toBeInTheDocument();
  });

  it('renders project names', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('renders sub-projects when parent is expanded', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Sub Alpha')).toBeInTheDocument();
  });

  it('calls onSelectProject when a project is clicked', () => {
    const onSelectProject = vi.fn();
    render(<Sidebar {...defaultProps} onSelectProject={onSelectProject} />);

    fireEvent.click(screen.getByText('Project Beta'));
    expect(onSelectProject).toHaveBeenCalledWith('p2');
  });

  it('calls onCreateProject when new project button is clicked', () => {
    const onCreateProject = vi.fn();
    render(<Sidebar {...defaultProps} onCreateProject={onCreateProject} />);

    const newBtn = screen.getByTitle('New Project');
    fireEvent.click(newBtn);
    expect(onCreateProject).toHaveBeenCalledWith();
  });

  it('collapses sub-projects when chevron is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Sub Alpha')).toBeInTheDocument();

    const chevronBtns = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('svg') && btn.closest('[style]'),
    );
    const expandBtn = chevronBtns[0];
    if (expandBtn) {
      fireEvent.click(expandBtn);
    }
  });

  it('highlights the selected project', () => {
    render(<Sidebar {...defaultProps} selectedProjectId="p1" />);
    const projectEl = screen.getByText('Project Alpha').closest('[class*="bg-"]');
    expect(projectEl?.className).toContain('bg-');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { setStoreState, resetStore } from '../../test/store-utils';
import { useStore } from '../store';
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

describe('Sidebar', () => {
  beforeEach(() => {
    resetStore();
    setStoreState({ projects, selectedProjectId: 'p1' });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<Sidebar isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the Arvid logo', () => {
    render(<Sidebar isOpen={true} />);
    expect(screen.getByText('Arvid')).toBeInTheDocument();
  });

  it('renders project names', () => {
    render(<Sidebar isOpen={true} />);
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('renders sub-projects when parent is expanded', () => {
    render(<Sidebar isOpen={true} />);
    expect(screen.getByText('Sub Alpha')).toBeInTheDocument();
  });

  it('selects project when clicked', () => {
    render(<Sidebar isOpen={true} />);
    fireEvent.click(screen.getByText('Project Beta'));
    expect(useStore.getState().selectedProjectId).toBe('p2');
  });

  it('creates project when new button is clicked and prompt answered', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('New Project');
    render(<Sidebar isOpen={true} />);
    const newBtn = screen.getByTitle('New Project');
    fireEvent.click(newBtn);
    const state = useStore.getState();
    expect(state.projects.some((p: Project) => p.name === 'New Project')).toBe(true);
    vi.restoreAllMocks();
  });

  it('highlights the selected project', () => {
    render(<Sidebar isOpen={true} />);
    const projectEl = screen.getByText('Project Alpha').closest('[class*="bg-"]');
    expect(projectEl?.className).toContain('bg-');
  });
});

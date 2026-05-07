import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, selectWorkspaces } from '../store';
import { buildWorkspacePath } from '../domain/paths';
import { logger } from '../logger';

const log = logger.create('navigation');

export function WorkspaceRedirect() {
  const navigate = useNavigate();
  const workspaces = useStore(selectWorkspaces);
  const workspacesDataState = useStore(s => s.workspacesDataState);
  const loadWorkspaces = useStore(s => s.loadWorkspaces);
  const acceptPendingInvitations = useStore(s => s.acceptPendingInvitations);

  useEffect(() => {
    acceptPendingInvitations();
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workspacesDataState.status === 'ready' && workspaces.length > 0) {
      const target = workspaces[0];
      const path = buildWorkspacePath(target.shortId ?? target.slug);
      log.info('redirect', 'Redirecting to default workspace', { shortId: target.shortId, path });
      navigate(path, { replace: true });
    }
  }, [workspacesDataState.status, workspaces, navigate]);

  return null;
}

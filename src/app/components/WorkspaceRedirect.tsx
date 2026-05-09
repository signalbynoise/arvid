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
  const acceptInvitationsState = useStore(s => s.acceptInvitationsState);

  useEffect(() => {
    useStore.setState({ acceptInvitationsState: { status: 'idle' } });
    async function init() {
      await acceptPendingInvitations();
      loadWorkspaces();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeWorkspaceId = useStore(s => s.activeWorkspaceId);

  useEffect(() => {
    if (acceptInvitationsState.status === 'resolving') return;
    if (workspacesDataState.status === 'ready' && workspaces.length > 0) {
      const target = (activeWorkspaceId && workspaces.find(w => w.id === activeWorkspaceId))
        || workspaces[0];
      const path = buildWorkspacePath(target.slug);
      log.info('redirect', 'Redirecting to default workspace', { slug: target.slug, path });
      navigate(path, { replace: true });
    }
  }, [acceptInvitationsState.status, workspacesDataState.status, workspaces, activeWorkspaceId, navigate]);

  return null;
}

import { Outlet } from 'react-router-dom';
import { useRouterResolver } from '../machines/useRouterResolver';

export function WorkspaceLayout() {
  useRouterResolver();
  return <Outlet />;
}

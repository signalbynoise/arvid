import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-base text-text-primary">
        <LoaderPinwheel className="animate-spin" size={ICON_SIZE.xl} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const loginPath = location.search
      ? `/login${location.search}`
      : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

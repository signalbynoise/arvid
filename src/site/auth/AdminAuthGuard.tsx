import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthProvider';
import { LoaderPinwheel } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-base text-text-primary">
        <LoaderPinwheel className="animate-spin" size={ICON_SIZE.xl} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

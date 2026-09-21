import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppModeStore } from '../../stores/useAppModeStore';
import { ROUTES } from '../../routes';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { mode } = useAppModeStore();
  const { user, loading, initialized } = useAuthStore();
  const location = useLocation();

  // If in offline mode, do not require Supabase auth
  if (mode === 'offline') {
    return children ? <>{children}</> : <Outlet />;
  }

  if (loading && !initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg animate-pulse">
          <span className="material-symbols-outlined text-2xl">inventory_2</span>
        </div>
        <div className="flex items-center gap-2 text-teal-700 font-medium text-sm">
          <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
          <span>Memverifikasi sesi...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

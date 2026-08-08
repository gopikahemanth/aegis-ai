import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute acts as a layout wrapper for authenticated-only routes.
 * It does not require props as it derives state from AuthContext.
 */
export const ProtectedRoute = () => {
  const {  isAuthenticated, isLoading  } = (useAuth() as any) || {};

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Authenticating...
      </div>
    );
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute: React.FC<any> = () => {
  const {  isAuthenticated  } = (useAuth() as any) || {};
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
export default ProtectedRoute;

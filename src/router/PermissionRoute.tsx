import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Route } from '../config/permissions';

interface PermissionRouteProps {
  children: ReactNode;
  route: Route;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, route }) => {
  const location = useLocation();
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(route)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;

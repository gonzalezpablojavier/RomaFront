import React, { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { isAccessTokenUsable } from '../api/api_auth';
import {
  getEmpresaAccessToken,
  getEmpresaPanelId,
} from '../session/empresaSessionStore';

interface EmpresaPrivateRouteProps {
  children: ReactNode;
}

const EmpresaPrivateRoute: React.FC<EmpresaPrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const { empresaId } = useParams<{ empresaId: string }>();
  const token = getEmpresaAccessToken();
  const storedEmpresaId = getEmpresaPanelId();

  const tokenOk = token ? isAccessTokenUsable(token) : false;
  const tenantOk =
    !!empresaId && !!storedEmpresaId && storedEmpresaId === String(empresaId);

  if (!tokenOk || !tenantOk) {
    return (
      <Navigate to="/auth/LoginCover" state={{ from: location }} replace />
    );
  }

  return <>{children}</>;
};

export default EmpresaPrivateRoute;

import React, { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { isAccessTokenUsable } from '../api/api_auth';

interface EmpresaPrivateRouteProps {
  children: ReactNode;
}

const EmpresaPrivateRoute: React.FC<EmpresaPrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const { empresaId } = useParams<{ empresaId: string }>();
  const token = localStorage.getItem('empresaToken');
  const storedEmpresaId = localStorage.getItem('l_empresa_id');

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

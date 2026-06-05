import React, { createContext, useContext, useState, ReactNode, useEffect,useCallback } from 'react';
import { Route, hasPermission } from '../config/permissions';
import { ensureFreshAccessToken, setDefaultHeaders } from '../api/api_auth';

interface AuthContextType {
 
  isAuthenticated: boolean;
  user: any;
  empresaId: string | null;
  login: (user: any, empresaID: string) => void;
  logout: () => void;
  recoverSession: () => Promise<boolean>;
  hasPermission: (route: Route) => boolean;
}

interface MyComponentProps {
  children?: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<MyComponentProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('isAuthenticated');
    return saved ? JSON.parse(saved) : false;
  });
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [empresaId, setEmpresaID] = useState<string | null>(() => {
    return localStorage.getItem('l_empresa_id');
  });

  const recoverSession = useCallback(async () => {
    try {
      await ensureFreshAccessToken();
      setDefaultHeaders();
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isAuthenticated) {
        try {
          await ensureFreshAccessToken();
        } catch {
          // La recuperación silenciosa puede fallar en sesiones viejas sin cookie refresh.
          // No mostramos banner ni limpiamos sesión: solo "Cerrar sesión" desloguea.
        }
      }
      if (alive) setDefaultHeaders();
    })();
    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  const login = useCallback((user: string, empresaId: string) => {
    setUser(user);
    setEmpresaID(empresaId);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('l_empresa_id', empresaId);
    localStorage.setItem('isAuthenticated', 'true');
  }, []);

  const logout = () => {
    setUser(null);
    setEmpresaID(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('l_empresa_id');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
  };
  
  const checkPermission = (route: Route): boolean => {
    if (!user || !empresaId) return false;
     console.log('Current user:', user.user_code);
    return hasPermission( String(user.user_code), route,empresaId);
  };

  return (
    <AuthContext.Provider 
    value={{ 
      isAuthenticated, 
      user,
      empresaId,
      login, logout, recoverSession, hasPermission: checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

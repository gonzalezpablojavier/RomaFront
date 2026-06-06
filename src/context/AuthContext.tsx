import React, { useCallback, useEffect, useState, ReactNode } from 'react';
import { Route, hasPermission } from '../config/permissions';
import {
  ensureFreshAccessToken,
  fetchSessionProfile,
  logoutUser,
  setDefaultHeaders,
} from '../api/api_auth';
import {
  clearSession,
  getSessionEmpresaId,
  getSessionUser,
  purgeLegacyAuthStorage,
  setSession,
  type SessionUser,
} from '../session/sessionStore';
import {
  clearTenantConfigCache,
  loadTenantConfig,
  getTenantBranding,
} from '../services/tenantConfigService';
import {
  clearTenantRbacCache,
  hydrateTenantRbac,
} from '../services/tenantRbacService';

interface AuthContextType {
  isAuthenticated: boolean;
  sessionReady: boolean;
  user: SessionUser | null;
  empresaId: string | null;
  login: (user: SessionUser, empresaID: string) => void;
  logout: () => void;
  recoverSession: () => Promise<boolean>;
  hasPermission: (route: Route) => boolean;
}

interface MyComponentProps {
  children?: ReactNode;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<MyComponentProps> = ({ children }) => {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(() => getSessionUser());
  const [empresaId, setEmpresaID] = useState<string | null>(() =>
    getSessionEmpresaId(),
  );

  const hydrateTenantConfig = useCallback(async (tenantId: string | null) => {
    if (!tenantId) return;
    try {
      await Promise.all([
        loadTenantConfig(tenantId),
        hydrateTenantRbac(tenantId),
      ]);
      const branding = getTenantBranding(tenantId);
      if (branding.displayName) {
        document.title = branding.displayName;
      }
    } catch (err) {
      console.warn('[tenant] No se pudo cargar config/RBAC del tenant:', err);
    }
  }, []);

  const applySession = useCallback(
    async (nextUser: SessionUser, nextEmpresaId: string) => {
      setSession(nextUser, nextEmpresaId);
      setUser(nextUser);
      setEmpresaID(nextEmpresaId);
      setIsAuthenticated(true);
      setDefaultHeaders();
      await hydrateTenantConfig(nextEmpresaId);
    },
    [hydrateTenantConfig],
  );

  const recoverSession = useCallback(async () => {
    try {
      await ensureFreshAccessToken();
      const profile = await fetchSessionProfile();
      await applySession(
        {
          user_code: String(profile.colaboradorID),
          nombreUsuario: profile.nombreUsuario,
        },
        profile.empresaId,
      );
      return true;
    } catch {
      clearSession();
      setUser(null);
      setEmpresaID(null);
      setIsAuthenticated(false);
      setDefaultHeaders();
      return false;
    }
  }, [applySession]);

  useEffect(() => {
    purgeLegacyAuthStorage();
    let alive = true;
    (async () => {
      const ok = await recoverSession();
      if (!alive) return;
      if (!ok) {
        setIsAuthenticated(false);
      }
      setSessionReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [recoverSession]);

  const login = useCallback(
    (nextUser: SessionUser, nextEmpresaId: string) => {
      void applySession(nextUser, nextEmpresaId);
    },
    [applySession],
  );

  const logout = () => {
    void logoutUser();
    clearSession();
    clearTenantConfigCache();
    clearTenantRbacCache();
    setUser(null);
    setEmpresaID(null);
    setIsAuthenticated(false);
    setDefaultHeaders();
  };

  const checkPermission = (route: Route): boolean => {
    if (!user || !empresaId) return false;
    return hasPermission(String(user.user_code), route, empresaId);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        sessionReady,
        user,
        empresaId,
        login,
        logout,
        recoverSession,
        hasPermission: checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

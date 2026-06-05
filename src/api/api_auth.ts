import axios, { AxiosInstance } from 'axios';
import { apiClient } from './apiClient';

interface LoginResponse {
  colaboradorID: string;
  empresaId: string;
  nombreUsuario: string;
  
  access_token: string;
  // Añade aquí cualquier otro campo que tu API devuelva
}

type RefreshResponse = {
  access_token: string;
};

const ACCESS_TOKEN_REFRESH_MARGIN_SECONDS = 60;

function isAuthRequest(config: any) {
  const url = String(config?.url ?? '');
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

function isUnauthorizedError(e: any) {
  return Number(e?.response?.status) === 401;
}

let refreshPromise: Promise<string> | null = null;

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function shouldRefreshAccessToken(token: string) {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return false;

  const now = Math.floor(Date.now() / 1000);
  return exp - now <= ACCESS_TOKEN_REFRESH_MARGIN_SECONDS;
}

/** Token aún aceptable por el backend (con margen de reloj). */
export function isAccessTokenUsable(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return false;
  return exp > Math.floor(Date.now() / 1000) + 5;
}






export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      { username, password },
    );

    console.log('Login response api_auth:', response.data);

    // Guardar el token y el empresaId en el almacenamiento local
    if (response.data.access_token) {
      // authToken es el key "oficial" de este frontend para axios
      localStorage.setItem('authToken', response.data.access_token);
      // token se usa en otras partes del proyecto (ej: chatbot.service.ts)
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('l_empresa_id', response.data.empresaId);
      // Aplicar headers globales inmediatamente (evita 401 por timing/hot reload)
      setDefaultHeaders();
      console.log(response.data.empresaId);
    }

    return response.data;
  } catch (error) {
    console.error('Error durante el login:', error);
    throw error;
  }
};

// Función para configurar los headers por defecto para futuras solicitudes
export const setDefaultHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const empresaId = localStorage.getItem('l_empresa_id');

  const applyHeaders = (client: AxiosInstance) => {
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common['Authorization'];
    }
    if (empresaId) {
      client.defaults.headers.common['x-empresa-id'] = empresaId;
    } else {
      delete client.defaults.headers.common['x-empresa-id'];
    }
  };

  applyHeaders(axios);
  applyHeaders(apiClient);
};

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const empresaId = localStorage.getItem('l_empresa_id');
    const resp = await apiClient.post<RefreshResponse>(
      '/auth/refresh',
      null,
      {
        headers: empresaId ? { 'x-empresa-id': empresaId } : undefined,
      },
    );

    const token = resp.data?.access_token;
    if (!token) throw new Error('Refresh sin access_token');

    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
    setDefaultHeaders();
    return token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function ensureFreshAccessToken(): Promise<string | null> {
  const stored = localStorage.getItem('authToken') || localStorage.getItem('token');

  try {
    if (stored && !shouldRefreshAccessToken(stored)) return stored;
    return await refreshAccessToken();
  } catch {
    // Refresh 401 (sin cookie rrhh_refresh o sesión vieja): usar access si aún sirve.
    if (stored && isAccessTokenUsable(stored)) return stored;
    return null;
  }
}

function attachAuthInterceptors(client: AxiosInstance) {
  const key = '__rrhh_auth_interceptor__';
  if ((client as any)[key]) return;
  (client as any)[key] = true;

  client.interceptors.request.use(async (config) => {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const empresaId = localStorage.getItem('l_empresa_id');

    if (token && !isAuthRequest(config) && shouldRefreshAccessToken(token)) {
      try {
        token = await refreshAccessToken();
      } catch {
        // No expulsamos al usuario por un fallo puntual de refresh.
        // La request original seguirá su curso y el backend decidirá.
      }
    }

    config.headers = config.headers ?? {};
    if (token && !isAuthRequest(config)) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    if (empresaId && !(config.headers as any)['x-empresa-id']) {
      (config.headers as any)['x-empresa-id'] = empresaId;
    }
    return config;
  });

  client.interceptors.response.use(
    (r) => r,
    async (error) => {
      const config = error?.config;
      if (!isUnauthorizedError(error) || !config) throw error;
      if (isAuthRequest(config)) throw error;

      if ((config as any).__retried) throw error;
      (config as any).__retried = true;

      let token: string;
      try {
        token = await refreshAccessToken();
      } catch {
        throw error;
      }

      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
      return client(config);
    },
  );
}

// Inicialización global (evita 401 por timing tras refresh).
axios.defaults.withCredentials = true;
attachAuthInterceptors(axios as AxiosInstance);
attachAuthInterceptors(apiClient);
setDefaultHeaders();
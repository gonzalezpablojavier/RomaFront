import axios from 'axios';

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

function isDesempenoRequest(config: any) {
  const url = String(config?.url ?? '');
  return url.includes('/desempeno');
}

function isDesempenoRoute(): boolean {
  try {
    return typeof window !== 'undefined' && window.location?.pathname?.includes('/desempeno');
  } catch {
    return false;
  }
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
    const response = await axios.post<LoginResponse>(
      `${import.meta.env.VITE_API_DISTRI_API}/auth/login`, 
      { username, password },
      { withCredentials: true },
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

  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
  if (empresaId) {
    axios.defaults.headers.common['x-empresa-id'] = empresaId;
  } else {
    delete axios.defaults.headers.common['x-empresa-id'];
  }
};

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const empresaId = localStorage.getItem('l_empresa_id');
    const resp = await axios.post<RefreshResponse>(
      `${import.meta.env.VITE_API_DISTRI_API}/auth/refresh`,
      null,
      {
        withCredentials: true,
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
  // En desempeño no forzamos refresh automático (modo "público").
  if (isDesempenoRoute()) {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

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

const setupAuthInterceptor = () => {
  // Evita registrar múltiples interceptores (hot reload / imports duplicados)
  const key = '__rrhh_auth_interceptor__';
  if ((axios as any)[key]) return;
  (axios as any)[key] = true;

  axios.interceptors.request.use(async (config) => {
    let token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const empresaId = localStorage.getItem('l_empresa_id');

    if (
      token &&
      !isAuthRequest(config) &&
      !isDesempenoRequest(config) &&
      shouldRefreshAccessToken(token)
    ) {
      try {
        token = await refreshAccessToken();
      } catch {
        // No expulsamos al usuario por un fallo puntual de refresh.
        // La request original seguirá su curso y el backend decidirá.
      }
    }

    config.headers = config.headers ?? {};
    if (token && !isAuthRequest(config) && !isDesempenoRequest(config)) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    if (empresaId && !(config.headers as any)['x-empresa-id']) {
      (config.headers as any)['x-empresa-id'] = empresaId;
    }
    return config;
  });

  axios.interceptors.response.use(
    (r) => r,
    async (error) => {
      const config = error?.config;
      if (!isUnauthorizedError(error) || !config) throw error;
      if (isAuthRequest(config)) throw error;
      // En desempeño permitimos modo "público": no forzamos refresh/reintentos.
      if (isDesempenoRequest(config)) throw error;

      // Evitar loop infinito
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
      return axios(config);
    },
  );
};

// Inicialización global (evita 401 por timing tras refresh).
axios.defaults.withCredentials = true;
setupAuthInterceptor();
setDefaultHeaders();
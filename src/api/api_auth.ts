import axios, { AxiosInstance } from 'axios';
import { apiClient } from './apiClient';
import {
  clearSession,
  getSessionEmpresaId,
  purgeLegacyAuthStorage,
  setSession,
} from '../session/sessionStore';

interface LoginResponse {
  colaboradorID: string | number;
  empresaId: string;
  nombreUsuario: string;
  access_token: string;
  type?: string;
  mfaRequired?: false;
}

export interface MfaPendingResponse {
  mfaRequired: true;
  mfaEnrollmentRequired: boolean;
  mfaChallengeToken: string;
  colaboradorID: string | number;
  nombreUsuario: string;
  empresaId: string;
}

export type LoginResult = LoginResponse | MfaPendingResponse;

export function isMfaPending(data: LoginResult): data is MfaPendingResponse {
  return data?.mfaRequired === true;
}

export type MfaEnrollBeginResponse = {
  otpauthUrl: string;
  secretBase32: string;
  issuer: string;
  account: string;
};

type RefreshResponse = LoginResponse;

const ACCESS_TOKEN_REFRESH_MARGIN_SECONDS = 60;

let memoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

function isAuthRequest(config: any) {
  const url = String(config?.url ?? '');
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/mfa/')
  );
}

function isUnauthorizedError(e: any) {
  return Number(e?.response?.status) === 401;
}

let refreshPromise: Promise<RefreshResponse> | null = null;

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

export function isAccessTokenUsable(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return false;
  return exp > Math.floor(Date.now() / 1000) + 5;
}

function applySessionFromAuthResponse(data: RefreshResponse) {
  if (data.empresaId && data.colaboradorID != null) {
    setSession(
      {
        user_code: String(data.colaboradorID),
        nombreUsuario: data.nombreUsuario,
      },
      data.empresaId,
    );
  }
}

export const loginUser = async (
  username: string,
  password: string,
): Promise<LoginResult> => {
  const response = await apiClient.post<LoginResult>('/auth/login', {
    username,
    password,
  });

  if (isMfaPending(response.data)) {
    return response.data;
  }

  if (response.data.access_token) {
    setAccessToken(response.data.access_token);
    applySessionFromAuthResponse(response.data);
    setDefaultHeaders();
  }

  return response.data;
};

function applyMfaSession(data: LoginResponse) {
  setAccessToken(data.access_token);
  applySessionFromAuthResponse(data);
  setDefaultHeaders();
}

export async function mfaEnrollBegin(
  mfaChallengeToken: string,
): Promise<MfaEnrollBeginResponse> {
  const { data } = await apiClient.post<MfaEnrollBeginResponse>(
    '/auth/mfa/enroll/begin',
    { mfaChallengeToken },
  );
  return data;
}

export async function mfaEnrollConfirm(
  mfaChallengeToken: string,
  code: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/mfa/enroll/confirm',
    { mfaChallengeToken, code },
  );
  applyMfaSession(data);
  return data;
}

export async function mfaVerify(
  mfaChallengeToken: string,
  code: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/mfa/verify', {
    mfaChallengeToken,
    code,
  });
  applyMfaSession(data);
  return data;
}

export type SessionProfile = {
  colaboradorID: number;
  nombreUsuario: string;
  empresaId: string;
  type: 'colaborador';
};

export async function fetchSessionProfile(): Promise<SessionProfile> {
  const { data } = await apiClient.get<SessionProfile>('/auth/me');
  return data;
}

export const setDefaultHeaders = () => {
  const token = getAccessToken();
  const empresaId = getSessionEmpresaId();

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

async function refreshAccessToken(): Promise<RefreshResponse> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const resp = await apiClient.post<RefreshResponse>('/auth/refresh', null);
    const data = resp.data;
    if (!data?.access_token) throw new Error('Refresh sin access_token');
    setAccessToken(data.access_token);
    applySessionFromAuthResponse(data);
    setDefaultHeaders();
    return data;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function ensureFreshAccessToken(): Promise<string | null> {
  const stored = getAccessToken();

  try {
    if (stored && !shouldRefreshAccessToken(stored)) return stored;
    const data = await refreshAccessToken();
    return data.access_token;
  } catch {
    if (stored && isAccessTokenUsable(stored)) return stored;
    try {
      const data = await refreshAccessToken();
      return data.access_token;
    } catch {
      return null;
    }
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // cookie inválida o sesión ya cerrada
  }
  setAccessToken(null);
  clearSession();
  setDefaultHeaders();
}

function attachAuthInterceptors(client: AxiosInstance) {
  const key = '__rrhh_auth_interceptor__';
  if ((client as any)[key]) return;
  (client as any)[key] = true;

  client.interceptors.request.use(async (config) => {
    let token = getAccessToken();
    const empresaId = getSessionEmpresaId();

    if (token && !isAuthRequest(config) && shouldRefreshAccessToken(token)) {
      try {
        const data = await refreshAccessToken();
        token = data.access_token;
      } catch {
        // sigue con token actual
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

      try {
        const data = await refreshAccessToken();
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${data.access_token}`;
        return client(config);
      } catch {
        throw error;
      }
    },
  );
}

purgeLegacyAuthStorage();
axios.defaults.withCredentials = true;
attachAuthInterceptors(axios as AxiosInstance);
attachAuthInterceptors(apiClient);
setDefaultHeaders();

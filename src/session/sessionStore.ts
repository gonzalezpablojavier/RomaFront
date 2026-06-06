export type SessionUser = {
  user_code: string;
  nombreUsuario?: string;
};

let sessionUser: SessionUser | null = null;
let sessionEmpresaId: string | null = null;

export function getSessionUser(): SessionUser | null {
  return sessionUser;
}

export function getSessionUserId(): string | null {
  return sessionUser?.user_code ?? null;
}

export function getSessionEmpresaId(): string | null {
  return sessionEmpresaId;
}

export function setSession(user: SessionUser | null, empresaId: string | null): void {
  sessionUser = user;
  sessionEmpresaId = empresaId;
}

export function clearSession(): void {
  sessionUser = null;
  sessionEmpresaId = null;
}

/** Limpia residuos legacy de auth en localStorage (migración XSS). */
export function purgeLegacyAuthStorage(): void {
  const keys = [
    'user',
    'l_empresa_id',
    'isAuthenticated',
    'authToken',
    'token',
    'empresaToken',
    'colaboradorID',
  ];
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

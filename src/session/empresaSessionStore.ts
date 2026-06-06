let empresaAccessToken: string | null = null;
let empresaPanelId: string | null = null;

export function getEmpresaAccessToken(): string | null {
  return empresaAccessToken;
}

export function getEmpresaPanelId(): string | null {
  return empresaPanelId;
}

export function setEmpresaSession(token: string, panelId: string | number): void {
  empresaAccessToken = token;
  empresaPanelId = String(panelId);
}

export function clearEmpresaSession(): void {
  empresaAccessToken = null;
  empresaPanelId = null;
}

/** Residuos legacy del panel enterprise en localStorage. */
export function purgeLegacyEmpresaAuthStorage(): void {
  localStorage.removeItem('empresaToken');
  localStorage.removeItem('l_empresa_id');
}

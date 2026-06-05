import { apiClient } from '../api/apiClient';
import { EMPTY_TENANT_CONFIG, TenantConfig } from '../types/tenantConfig';

const cache = new Map<string, TenantConfig>();

export function getCachedTenantConfig(tenantId: string): TenantConfig | null {
  return cache.get(tenantId) ?? null;
}

export async function loadTenantConfig(tenantId: string): Promise<TenantConfig> {
  const id = String(tenantId || 'default');
  const { data } = await apiClient.get<TenantConfig>(`/tenants/${id}/config`);
  cache.set(id, data);
  return data;
}

export function clearTenantConfigCache(tenantId?: string) {
  if (tenantId) {
    cache.delete(tenantId);
    return;
  }
  cache.clear();
}

/** Fallback local si el API aún no respondió (offline / primera carga). */
export function getTenantConfigOrEmpty(tenantId: string): TenantConfig {
  return (
    getCachedTenantConfig(tenantId) ?? {
      tenantId: idOrDefault(tenantId),
      ...EMPTY_TENANT_CONFIG,
    }
  );
}

function idOrDefault(tenantId: string) {
  return String(tenantId || 'default');
}

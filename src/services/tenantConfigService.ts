import { apiClient } from '../api/apiClient';
import {
  DEFAULT_TENANT_BRANDING,
  DEFAULT_TENANT_FEATURES,
  DEFAULT_TENANT_SECURITY,
  EMPTY_TENANT_CONFIG,
  TenantConfig,
  TenantFeatures,
  TenantBranding,
} from '../types/tenantConfig';

const cache = new Map<string, TenantConfig>();

export function getCachedTenantConfig(tenantId?: string): TenantConfig | null {
  if (tenantId) return cache.get(tenantId) ?? null;
  const first = cache.values().next();
  return first.done ? null : first.value;
}

export async function loadTenantConfig(tenantId: string): Promise<TenantConfig> {
  const id = String(tenantId || 'default');
  const { data } = await apiClient.get<TenantConfig>(`/tenants/${id}/config`);
  const normalized: TenantConfig = {
    tenantId: data.tenantId ?? id,
    areas: data.areas ?? [],
    branding: { ...DEFAULT_TENANT_BRANDING, ...data.branding },
    features: { ...DEFAULT_TENANT_FEATURES, ...data.features },
    security: { ...DEFAULT_TENANT_SECURITY, ...data.security },
  };
  cache.set(id, normalized);
  return normalized;
}

export function clearTenantConfigCache(tenantId?: string) {
  if (tenantId) {
    cache.delete(tenantId);
    return;
  }
  cache.clear();
}

export function getTenantConfigOrEmpty(tenantId: string): TenantConfig {
  return (
    getCachedTenantConfig(tenantId) ?? {
      tenantId: String(tenantId || 'default'),
      ...EMPTY_TENANT_CONFIG,
    }
  );
}

export function getTenantBranding(tenantId: string): TenantBranding {
  return getTenantConfigOrEmpty(tenantId).branding ?? DEFAULT_TENANT_BRANDING;
}

export function getTenantFeatures(tenantId: string): TenantFeatures {
  return getTenantConfigOrEmpty(tenantId).features ?? DEFAULT_TENANT_FEATURES;
}

export function getTenantAreas(tenantId: string): string[] {
  return getTenantConfigOrEmpty(tenantId).areas ?? [];
}

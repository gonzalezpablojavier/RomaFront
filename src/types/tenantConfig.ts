export interface TenantConfig {
  tenantId: string;
  areas: string[];
}

export const EMPTY_TENANT_CONFIG: Omit<TenantConfig, 'tenantId'> = {
  areas: [],
};

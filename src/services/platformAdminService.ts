import { apiClient } from '../api/apiClient';
import { TenantCatalog } from '../types/tenantRbac';
import { TenantConfig } from '../types/tenantConfig';

export interface PlatformTenant {
  id: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantDetailStats {
  colaboradores: number;
  areas: number;
  sucursales: number;
  roleAssignments: number;
}

export interface TenantDetail extends PlatformTenant {
  config: TenantConfig;
  stats: TenantDetailStats;
}

export interface CreateTenantPayload {
  tenantId: string;
  displayName: string;
  areas?: string[];
  sucursales?: string[];
  seedDefaultRoles?: boolean;
  empresaPanelNombre?: string;
  empresaPanelEmail?: string;
  empresaPanelUser?: string;
  empresaPanelPass?: string;
  logoUrl?: string;
  accentColor?: string;
  mundialHome?: boolean;
  miDesempenoHomeTile?: boolean;
  commercialGeoCheckIn?: boolean;
  mfaRequired?: boolean;
}

export interface UpdateTenantConfigPayload {
  areas?: string[];
  displayName?: string;
  logoUrl?: string;
  accentColor?: string;
  mundialHome?: boolean;
  miDesempenoHomeTile?: boolean;
  commercialGeoCheckIn?: boolean;
  mfaRequired?: boolean;
  internalNotes?: string;
}

export interface CreateColaboradorPayload {
  nombreUsuario: string;
  password?: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  area: string;
  sucursal: string;
  roleCode?: string;
  sendWhatsApp?: boolean;
}

export interface CreateColaboradorResult {
  colaboradorId: number;
  nombreUsuario: string;
  tenantId: string;
  temporaryPassword: string;
  roleCode: string;
  whatsAppSent: boolean;
  whatsAppError: string | null;
}

export interface PlatformGlobalUser {
  tenantId: string;
  tenantDisplayName: string;
  colaboradorId: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  email: string;
  sucursal: string;
  area: string;
  primaryRoleCode: string | null;
  primaryRoleName: string | null;
  isPlatformAdmin: boolean;
  roleCodes: string[];
}

export interface ResetPasswordResult {
  tenantId: string;
  colaboradorId: number;
  nombreUsuario: string;
  temporaryPassword: string;
}

export const platformAdminService = {
  listTenants: async () => {
    const { data } = await apiClient.get<PlatformTenant[]>('/platform/tenants');
    return data;
  },

  getTenantDetail: async (tenantId: string) => {
    const { data } = await apiClient.get<TenantDetail>(
      `/platform/tenants/${tenantId}`,
    );
    return data;
  },

  createTenant: async (payload: CreateTenantPayload) => {
    const { data } = await apiClient.post('/platform/tenants', payload);
    return data;
  },

  updateTenantConfig: async (
    tenantId: string,
    payload: UpdateTenantConfigPayload,
  ) => {
    const { data } = await apiClient.patch<TenantDetail>(
      `/platform/tenants/${tenantId}/config`,
      payload,
    );
    return data;
  },

  setTenantActive: async (tenantId: string, isActive: boolean) => {
    const { data } = await apiClient.patch<{ id: string; isActive: boolean }>(
      `/platform/tenants/${tenantId}/active`,
      { isActive },
    );
    return data;
  },

  getTenantCatalog: async (tenantId: string) => {
    const { data } = await apiClient.get<TenantCatalog>(
      `/platform/tenants/${tenantId}/catalog`,
    );
    return data;
  },

  createColaborador: async (
    tenantId: string,
    payload: CreateColaboradorPayload,
  ) => {
    const { data } = await apiClient.post<CreateColaboradorResult>(
      `/platform/tenants/${tenantId}/colaboradores`,
      payload,
    );
    return data;
  },

  sendCredentials: async (
    tenantId: string,
    colaboradorId: number,
    password?: string,
  ) => {
    const { data } = await apiClient.post<{ sent: boolean; telefono: string }>(
      `/platform/tenants/${tenantId}/colaboradores/${colaboradorId}/send-credentials`,
      password ? { password } : {},
    );
    return data;
  },

  listGlobalUsers: async () => {
    const { data } = await apiClient.get<PlatformGlobalUser[]>('/platform/users');
    return data;
  },

  setPlatformAdmin: async (
    tenantId: string,
    colaboradorId: number,
    isPlatformAdmin: boolean,
  ) => {
    const { data } = await apiClient.patch<{ isPlatformAdmin: boolean }>(
      `/platform/users/${tenantId}/${colaboradorId}/platform-admin`,
      { isPlatformAdmin },
    );
    return data;
  },

  resetUserPassword: async (
    tenantId: string,
    colaboradorId: number,
    password?: string,
  ) => {
    const { data } = await apiClient.post<ResetPasswordResult>(
      `/platform/users/${tenantId}/${colaboradorId}/reset-password`,
      password ? { password } : {},
    );
    return data;
  },

  updateGlobalUser: async (
    tenantId: string,
    colaboradorId: number,
    payload: {
      nombre?: string;
      apellido?: string;
      email?: string;
      roleCode?: string;
      isPlatformAdmin?: boolean;
    },
  ) => {
    const { data } = await apiClient.patch<PlatformGlobalUser>(
      `/platform/users/${tenantId}/${colaboradorId}`,
      payload,
    );
    return data;
  },
};

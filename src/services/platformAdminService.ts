import { apiClient } from '../api/apiClient';
import { TenantCatalog } from '../types/tenantRbac';

export interface PlatformTenant {
  id: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
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

export const platformAdminService = {
  listTenants: async () => {
    const { data } = await apiClient.get<PlatformTenant[]>('/platform/tenants');
    return data;
  },

  createTenant: async (payload: CreateTenantPayload) => {
    const { data } = await apiClient.post('/platform/tenants', payload);
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
};

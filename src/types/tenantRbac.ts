export interface TenantCatalogArea {
  id: number;
  code: string;
  name: string;
  flags?: { globalView?: boolean; excludeFromTeamPage?: boolean };
}

export interface TenantCatalogSucursal {
  id: number;
  code: string;
  name: string;
}

export interface TenantCatalogRole {
  id: number;
  code: string;
  name: string;
}

export interface TenantRoleAssignment {
  colaboradorId: number;
  roleCode: string;
  areaCode?: string | null;
  areaName?: string | null;
  sucursalCode?: string | null;
}

export interface TenantCatalog {
  tenantId: string;
  areas: TenantCatalogArea[];
  sucursales: TenantCatalogSucursal[];
  roles: TenantCatalogRole[];
  assignments?: TenantRoleAssignment[];
}

export interface TenantUserRoleAssignment {
  roleCode: string;
  roleName: string;
  areaCode?: string | null;
  areaName?: string | null;
  sucursalCode?: string | null;
  sucursalName?: string | null;
}

export interface TenantAccess {
  tenantId: string;
  colaboradorId: number;
  permissions: string[];
  roles: TenantUserRoleAssignment[];
  globalAreaView: boolean;
  globalSucursalView: boolean;
  scopedAreaCodes: string[];
  scopedSucursalCodes: string[];
}

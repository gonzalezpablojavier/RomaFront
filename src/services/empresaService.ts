// src/services/empresaService.ts — RBAC catalog + tenant_config (sin IDs hardcodeados).

import {
  getCachedTenantCatalog,
  getDepoSucursalLeaderIdsFromCatalog,
  getTenantAreaNames,
} from './tenantRbacService';
import { getTenantAreas } from './tenantConfigService';

export interface EmpresaConfigShape {
  areas: string[];
  managerIds: string[];
  managerLowIds: string[];
  managerHighIds: string[];
  managerAreas: Record<string, string>;
}

const EMPTY: EmpresaConfigShape = {
  areas: [],
  managerIds: [],
  managerLowIds: [],
  managerHighIds: [],
  managerAreas: {},
};

const MANAGER_ROLE_CODES = new Set([
  'manager',
  'manager_high',
  'manager_low',
  'depo_sucursal_leader',
  'depo_coordinator',
]);

function fromCatalogAssignments(empresaId: string): EmpresaConfigShape | null {
  const catalog = getCachedTenantCatalog();
  if (catalog?.tenantId !== String(empresaId || 'default')) return null;
  if (!catalog.assignments?.length) return null;

  const managerIds: string[] = [];
  const managerLowIds: string[] = [];
  const managerHighIds: string[] = [];
  const managerAreas: Record<string, string> = {};

  for (const a of catalog.assignments) {
    const id = String(a.colaboradorId);
    if (a.roleCode === 'manager' || a.roleCode === 'depo_sucursal_leader') {
      managerIds.push(id);
    }
    if (a.roleCode === 'manager_high') managerHighIds.push(id);
    if (a.roleCode === 'manager_low') managerLowIds.push(id);
    if (MANAGER_ROLE_CODES.has(a.roleCode) && a.areaName) {
      managerAreas[id] = a.areaName;
    }
  }

  const areasFromCatalog = catalog.areas.map((x) => x.name);
  const areasFromConfig = getTenantAreas(empresaId);

  return {
    areas: areasFromCatalog.length ? areasFromCatalog : areasFromConfig,
    managerIds: Array.from(new Set(managerIds)),
    managerLowIds: Array.from(new Set(managerLowIds)),
    managerHighIds: Array.from(new Set(managerHighIds)),
    managerAreas,
  };
}

export const getEmpresaConfig = (empresaId: string): EmpresaConfigShape => {
  return fromCatalogAssignments(empresaId) ?? {
    ...EMPTY,
    areas: getTenantAreas(empresaId),
  };
};

export const getAreasForEmpresa = (empresaId: string): string[] => {
  const fromCatalog = getTenantAreaNames();
  if (fromCatalog.length) return fromCatalog;
  return getTenantAreas(empresaId);
};

export const getSucursalesForEmpresa = (empresaId: string): string[] => {
  const catalog = getCachedTenantCatalog();
  if (catalog?.tenantId === String(empresaId || 'default') && catalog.sucursales.length) {
    return catalog.sucursales.map((s) => s.code);
  }
  return [];
};

export const getManagerIdsForEmpresa = (empresaId: string): string[] => {
  return getEmpresaConfig(empresaId).managerIds;
};

export const getManagerAreasForEmpresa = (
  empresaId: string,
): Record<string, string> => {
  return getEmpresaConfig(empresaId).managerAreas;
};

export const getDepoSucursalLeaderIds = (empresaId: string): Set<string> => {
  const catalog = getCachedTenantCatalog();
  if (catalog?.tenantId !== String(empresaId || 'default')) {
    return new Set();
  }
  return getDepoSucursalLeaderIdsFromCatalog();
};

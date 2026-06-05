// src/services/empresaService.ts

import { empresaConfig as staticEmpresaConfig } from '../config/empresaConfig';
import {
  getCachedTenantCatalog,
  getDepoSucursalLeaderIdsFromCatalog,
} from './tenantRbacService';

export interface EmpresaConfigShape {
  areas: string[];
  managerIds: string[];
  managerLowIds: string[];
  managerHighIds: string[];
  managerAreas: Record<string, string>;
}

const STATIC_DEFAULT: EmpresaConfigShape = {
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

function fromStatic(empresaId: string): EmpresaConfigShape {
  const cfg =
    staticEmpresaConfig[empresaId] ??
    staticEmpresaConfig['default'] ??
    STATIC_DEFAULT;
  return {
    areas: cfg.areas ?? [],
    managerIds: cfg.managerIds ?? [],
    managerLowIds: cfg.managerLowIds ?? [],
    managerHighIds: cfg.managerHighIds ?? [],
    managerAreas: cfg.managerAreas ?? {},
  };
}

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

  return {
    areas: catalog.areas.map((x) => x.name),
    managerIds: Array.from(new Set(managerIds)),
    managerLowIds: Array.from(new Set(managerLowIds)),
    managerHighIds: Array.from(new Set(managerHighIds)),
    managerAreas,
  };
}

export const getEmpresaConfig = (empresaId: string): EmpresaConfigShape => {
  return fromCatalogAssignments(empresaId) ?? fromStatic(empresaId);
};

export const getAreasForEmpresa = (empresaId: string): string[] => {
  return getEmpresaConfig(empresaId).areas;
};

export const getSucursalesForEmpresa = (empresaId: string): string[] => {
  const catalog = getCachedTenantCatalog();
  if (catalog?.tenantId === String(empresaId || 'default') && catalog.sucursales.length) {
    return catalog.sucursales.map((s) => s.code);
  }
  return ['PICO', 'MDP', 'DIMES', 'ROSARIO'];
};

export const getManagerIdsForEmpresa = (empresaId: string): string[] => {
  return getEmpresaConfig(empresaId).managerIds;
};

export const getManagerAreasForEmpresa = (
  empresaId: string,
): Record<string, string> => {
  return getEmpresaConfig(empresaId).managerAreas;
};

/** ColaboradorIDs con rol depo_sucursal_leader (desde catalog RBAC). */
export const getDepoSucursalLeaderIds = (empresaId: string): Set<string> => {
  const catalog = getCachedTenantCatalog();
  if (catalog?.tenantId !== String(empresaId || 'default')) {
    return new Set();
  }
  return getDepoSucursalLeaderIdsFromCatalog();
};

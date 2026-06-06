import { apiClient } from '../api/apiClient';
import { TenantAccess, TenantCatalog, TenantMember } from '../types/tenantRbac';

let catalogCache: TenantCatalog | null = null;
let accessCache: TenantAccess | null = null;

export function getCachedTenantCatalog(): TenantCatalog | null {
  return catalogCache;
}

export function getCachedTenantAccess(): TenantAccess | null {
  return accessCache;
}

export async function loadTenantCatalog(tenantId: string): Promise<TenantCatalog> {
  const id = String(tenantId || 'default');
  const { data } = await apiClient.get<TenantCatalog>(`/tenants/${id}/catalog`);
  catalogCache = data;
  return data;
}

export async function loadTenantAccess(tenantId: string): Promise<TenantAccess> {
  const id = String(tenantId || 'default');
  const { data } = await apiClient.get<TenantAccess>(`/tenants/${id}/access/me`);
  accessCache = data;
  return data;
}

export async function hydrateTenantRbac(tenantId: string): Promise<void> {
  await Promise.all([loadTenantCatalog(tenantId), loadTenantAccess(tenantId)]);
}

export function hasTenantPermission(permissionCode: string): boolean {
  return accessCache?.permissions.includes(permissionCode) ?? false;
}

export function canManageTenantRoles(): boolean {
  return hasTenantPermission('tenant.roles.manage');
}

export function canManageTenantAdmin(): boolean {
  return hasTenantPermission('tenant.admin');
}

export async function listTenantMembers(tenantId: string): Promise<TenantMember[]> {
  const id = String(tenantId || 'default');
  const { data } = await apiClient.get<TenantMember[]>(`/tenants/${id}/members`);
  return data;
}

export async function setTenantMemberRoles(
  tenantId: string,
  colaboradorId: number,
  payload: { roleCodes: string[]; areaName?: string; sucursalCode?: string },
): Promise<TenantMember> {
  const id = String(tenantId || 'default');
  const { data } = await apiClient.put<TenantMember>(
    `/tenants/${id}/members/${colaboradorId}/roles`,
    payload,
  );
  return data;
}

export function getTenantAreaNames(): string[] {
  return catalogCache?.areas.map((a) => a.name) ?? [];
}

export function getTenantSucursalCodes(): string[] {
  return catalogCache?.sucursales.map((s) => s.code) ?? [];
}

export function getTenantSucursalNames(): string[] {
  return catalogCache?.sucursales.map((s) => s.name) ?? [];
}

export function clearTenantRbacCache() {
  catalogCache = null;
  accessCache = null;
}

const LEADER_ROLE_CODES = [
  'manager',
  'manager_high',
  'manager_low',
  'depo_sucursal_leader',
] as const;

export function getCatalogAssignments() {
  return catalogCache?.assignments ?? [];
}

export function getColaboradorIdsByRoles(...roleCodes: string[]): Set<string> {
  const codes = new Set(roleCodes);
  return new Set(
    getCatalogAssignments()
      .filter((a) => codes.has(a.roleCode))
      .map((a) => String(a.colaboradorId)),
  );
}

export function getLeaderColaboradorIds(): Set<string> {
  return getColaboradorIdsByRoles(...LEADER_ROLE_CODES);
}

export function getDepoSucursalLeaderIdsFromCatalog(): Set<string> {
  return getColaboradorIdsByRoles('depo_sucursal_leader');
}

export function getDepoCoordinatorIds(): Set<string> {
  return getColaboradorIdsByRoles('depo_coordinator');
}

export function canDepoCoordinatorViewSucursalLeader(
  requesterId: string,
  targetId: string,
): boolean {
  return (
    getDepoCoordinatorIds().has(requesterId) &&
    getDepoSucursalLeaderIdsFromCatalog().has(targetId)
  );
}

export function getSucursalCodeForColaborador(
  colaboradorId: string,
): string | null {
  const hit = getCatalogAssignments().find(
    (a) => String(a.colaboradorId) === colaboradorId && a.sucursalCode,
  );
  return hit?.sucursalCode ?? null;
}

/** Líderes por área desde assignments RBAC (fallback vacío sin catalog). */
export function buildLeadersByArea(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  const roles = new Set(['manager', 'manager_high', 'depo_coordinator']);
  for (const a of getCatalogAssignments()) {
    if (!roles.has(a.roleCode) || !a.areaName) continue;
    if (!map[a.areaName]) map[a.areaName] = [];
    map[a.areaName].push(String(a.colaboradorId));
  }
  return map;
}

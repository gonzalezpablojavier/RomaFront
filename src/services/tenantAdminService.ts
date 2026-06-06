import { apiClient } from '../api/apiClient';
import type { TenantMember } from '../types/tenantRbac';

export interface TenantAdminOverview {
  areas: number;
  sucursales: number;
  roles: number;
  members: number;
  roleAssignments: number;
}

export interface TenantAdminArea {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  flags?: { globalView?: boolean };
}

export interface TenantAdminSucursal {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
}

export interface TenantAdminRole {
  id: number;
  code: string;
  name: string;
  permissions: string[];
  assignableByTenant: boolean;
}

export interface CreateTenantMemberPayload {
  nombreUsuario: string;
  password?: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  area: string;
  sucursal: string;
  roleCode?: string;
  roleCodes?: string[];
}

export interface UpdateTenantMemberPayload {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  area?: string;
  sucursal?: string;
}

export type CreateMemberResult = TenantMember & { temporaryPassword?: string };

function adminBase(tenantId: string) {
  return `/tenants/${String(tenantId || 'default')}/admin`;
}

export async function fetchTenantAdminOverview(
  tenantId: string,
): Promise<TenantAdminOverview> {
  const { data } = await apiClient.get<TenantAdminOverview>(
    `${adminBase(tenantId)}/overview`,
  );
  return data;
}

export async function listTenantAdminAreas(
  tenantId: string,
): Promise<TenantAdminArea[]> {
  const { data } = await apiClient.get<TenantAdminArea[]>(
    `${adminBase(tenantId)}/areas`,
  );
  return data;
}

export async function createTenantArea(
  tenantId: string,
  payload: { name: string; code?: string; globalView?: boolean },
): Promise<TenantAdminArea> {
  const { data } = await apiClient.post<TenantAdminArea>(
    `${adminBase(tenantId)}/areas`,
    payload,
  );
  return data;
}

export async function updateTenantArea(
  tenantId: string,
  areaId: number,
  payload: { name?: string; globalView?: boolean; sortOrder?: number },
): Promise<TenantAdminArea> {
  const { data } = await apiClient.patch<TenantAdminArea>(
    `${adminBase(tenantId)}/areas/${areaId}`,
    payload,
  );
  return data;
}

export async function deleteTenantArea(
  tenantId: string,
  areaId: number,
): Promise<void> {
  await apiClient.delete(`${adminBase(tenantId)}/areas/${areaId}`);
}

export async function listTenantAdminSucursales(
  tenantId: string,
): Promise<TenantAdminSucursal[]> {
  const { data } = await apiClient.get<TenantAdminSucursal[]>(
    `${adminBase(tenantId)}/sucursales`,
  );
  return data;
}

export async function createTenantSucursal(
  tenantId: string,
  payload: { code: string; name: string },
): Promise<TenantAdminSucursal> {
  const { data } = await apiClient.post<TenantAdminSucursal>(
    `${adminBase(tenantId)}/sucursales`,
    payload,
  );
  return data;
}

export async function updateTenantSucursal(
  tenantId: string,
  sucursalId: number,
  payload: { code?: string; name?: string; sortOrder?: number },
): Promise<TenantAdminSucursal> {
  const { data } = await apiClient.patch<TenantAdminSucursal>(
    `${adminBase(tenantId)}/sucursales/${sucursalId}`,
    payload,
  );
  return data;
}

export async function deleteTenantSucursal(
  tenantId: string,
  sucursalId: number,
): Promise<void> {
  await apiClient.delete(`${adminBase(tenantId)}/sucursales/${sucursalId}`);
}

export async function listTenantAdminRoles(
  tenantId: string,
): Promise<TenantAdminRole[]> {
  const { data } = await apiClient.get<TenantAdminRole[]>(
    `${adminBase(tenantId)}/roles`,
  );
  return data;
}

export async function listTenantAdminMembers(
  tenantId: string,
): Promise<TenantMember[]> {
  const { data } = await apiClient.get<TenantMember[]>(
    `${adminBase(tenantId)}/members`,
  );
  return data;
}

export async function createTenantAdminMember(
  tenantId: string,
  payload: CreateTenantMemberPayload,
): Promise<CreateMemberResult> {
  const { data } = await apiClient.post<CreateMemberResult>(
    `${adminBase(tenantId)}/members`,
    payload,
  );
  return data;
}

export async function updateTenantAdminMember(
  tenantId: string,
  colaboradorId: number,
  payload: UpdateTenantMemberPayload,
): Promise<TenantMember> {
  const { data } = await apiClient.patch<TenantMember>(
    `${adminBase(tenantId)}/members/${colaboradorId}`,
    payload,
  );
  return data;
}

export async function setTenantAdminMemberRoles(
  tenantId: string,
  colaboradorId: number,
  payload: { roleCodes: string[]; areaName?: string; sucursalCode?: string },
): Promise<TenantMember> {
  const { data } = await apiClient.put<TenantMember>(
    `${adminBase(tenantId)}/members/${colaboradorId}/roles`,
    payload,
  );
  return data;
}

export async function deleteTenantAdminMember(
  tenantId: string,
  colaboradorId: number,
): Promise<void> {
  await apiClient.delete(`${adminBase(tenantId)}/members/${colaboradorId}`);
}

// src/services/empresaService.ts

import { empresaConfig } from '../config/empresaConfig';

export const getEmpresaConfig = (empresaId: string) => {
  return empresaConfig[empresaId] || {
    areas: [],
    managerIds: [],
    managerAreas: {},
    // Configuración predeterminada si no se encuentra la empresa
  };
};

export const getAreasForEmpresa = (empresaId: string): string[] => {
  return getEmpresaConfig(empresaId).areas;
};

export const getManagerIdsForEmpresa = (empresaId: string): string[] => {
  return getEmpresaConfig(empresaId).managerIds;
};

export const getManagerAreasForEmpresa = (empresaId: string): { [key: string]: string } => {
  return getEmpresaConfig(empresaId).managerAreas;
};
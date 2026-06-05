import { apiClient } from '../api/apiClient';
import type {
  CambioNivel,
  CriterioConfig,
  ColaboradorDesempeno,
  Evaluacion,
  EvaluacionPayload,
  ResumenDesempeno,
} from '../types/desempeno';

type ApiResponse<T> = { ok: number; message: string; data: T };

export const desempenoService = {
  getConfig: () =>
    apiClient.get<
      ApiResponse<{
        CRITERIOS_POR_NIVEL: Record<'Jr' | 'Ssr' | 'Sr', CriterioConfig[]>;
        DESCRIPCION_NIVEL: Record<'Jr' | 'Ssr' | 'Sr', string>;
      }>
    >('/desempeno/config/criterios'),

  getTrimestreActivo: () =>
    apiClient.get<ApiResponse<{ trimestre: string }>>('/desempeno/config/trimestre-activo'),

  getColaboradores: (params?: { area?: string; sucursal?: string; nivel?: string; q?: string }) =>
    apiClient.get<ApiResponse<ColaboradorDesempeno[]>>('/desempeno/colaboradores', { params }),

  getColaborador: (colaboradorID: number) =>
    apiClient.get<ApiResponse<ColaboradorDesempeno>>(`/desempeno/colaborador/${colaboradorID}`),

  getEvaluacion: (colaboradorID: number, trimestre: string) =>
    apiClient.get<ApiResponse<Evaluacion | null>>(`/desempeno/evaluacion/${colaboradorID}/${trimestre}`),

  getResumen: (trimestre: string) =>
    apiClient.get<ApiResponse<ResumenDesempeno>>(`/desempeno/resumen/${trimestre}`),

  getRanking: (trimestre: string, params?: { area?: string; sucursal?: string; nivel?: string }) =>
    apiClient.get<ApiResponse<ColaboradorDesempeno[]>>(`/desempeno/ranking/${trimestre}`, { params }),

  getEvolucionGeneral: () =>
    apiClient.get<ApiResponse<Array<{ trimestre: string; scorePromedio: string | number }>>>(
      '/desempeno/evolucion/general',
    ),

  getEvolucionPorArea: () =>
    apiClient.get<ApiResponse<Array<{ trimestre: string; area: string; scorePromedio: string | number }>>>(
      '/desempeno/evolucion/por-area',
    ),

  getEvolucionNiveles: () =>
    apiClient.get<ApiResponse<Array<{ trimestre: string; nivel: 'Jr' | 'Ssr' | 'Sr'; cantidad: string | number }>>>(
      '/desempeno/evolucion/niveles',
    ),

  getEvolucionIndividual: (colaboradorID: number) =>
    apiClient.get<ApiResponse<Array<{ trimestre: string; scoreTotal: string | number; nivel: 'Jr' | 'Ssr' | 'Sr' }>>>(
      `/desempeno/evolucion/individual/${colaboradorID}`,
    ),

  getCambiosNivel: (params?: { area?: string; direccion?: string }) =>
    apiClient.get<ApiResponse<CambioNivel[]>>('/desempeno/cambios-nivel', { params }),

  getMiDesempeno: () =>
    apiClient.get<
      ApiResponse<{
        colaboradorID: number;
        nombre: string;
        apellido: string;
        nivel: 'Jr' | 'Ssr' | 'Sr';
        evaluaciones: Array<{ id: number; trimestre: string; nivel: 'Jr' | 'Ssr' | 'Sr'; scoreTotal: number }>;
        scoreActual: number | null;
      }>
    >('/desempeno/mi-desempeno'),

  guardarEvaluacion: (payload: EvaluacionPayload) =>
    apiClient.post<ApiResponse<any>>('/desempeno/evaluacion', payload),
};
